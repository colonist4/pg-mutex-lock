import type { Client } from 'pg';
import { parse } from 'pg-connection-string'
import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import { createClient } from './driver';

type ConstructionOptions = {
    database?: ConstructorParameters<typeof Client>[0],
    /** timeout in milliseconds (default: 10 * 1000 ms) */
    timeout?: number;
    /** (default: 3) */
    retryCount?: number;
}

enum EVENTS {
    CONNECTED = "connected",
    CONNECT_FAILED = "connect_failed"
}

export default class PGMutexLock {
    private timeout: number;
    private retryCount: number;
    private client: Client;
    private databaseId: number;
    private isConnected: boolean;
    private emitter: EventEmitter;

    constructor({
        database = {},
        timeout = 10 * 1000,
        retryCount = 3
    }: ConstructionOptions = {}){
        this.emitter = new EventEmitter();
        this.isConnected = false;
        this.timeout = timeout;
        this.retryCount = retryCount;

        const dbName = typeof database === 'string' ? 
            parse(database).database :
            database.database || process.env.PGDATABASE || process.env.USER;

        this.client = createClient(database);
        this.client.connect()
        .then(() => initTable(this.client, dbName))
        .then((oid) => {
            this.databaseId = oid;
            this.isConnected = true;
            this.emitter.emit(EVENTS.CONNECTED);
        })
        .catch((err)=>{
            console.error(err);
            this.emitter.emit(EVENTS.CONNECT_FAILED, err);
        })

        this.end = this.end.bind(this)
        this.acquireLock = this.acquireLock.bind(this)
        this.releaseLock = this.releaseLock.bind(this)
    }

    private waitConnection(){
        return new Promise<void>((resolve, reject)=>{
            if(this.isConnected) { resolve(); return; }
            this.emitter.once(EVENTS.CONNECTED, ()=>{
                resolve();
            })
            this.emitter.once(EVENTS.CONNECT_FAILED, (err)=>{
                reject(err)
            })
        })
    }

    async acquireLock(key: string){
        let [classid, objid] = strToKey(key);
        await this.waitConnection();

        // Check in session lock
        for(let i=0; i<this.retryCount; i++){
            let time = +new Date();
            while(+new Date() - time < this.timeout){
                let res = await this.client.query(`
                    SELECT
                        CASE count(*) WHEN 0 THEN (SELECT pg_try_advisory_lock($1, $2))
                                    ELSE FALSE
                        END as pg_try_advisory_lock
                    FROM
                        pg_locks
                    WHERE
                        pid = (
                            SELECT
                                pg_backend_pid()
                            )
                        AND locktype = 'advisory'
                        AND classid = $1 AND objid = $2
                        AND "database" = $3;
                `, [classid, objid, this.databaseId]);
                if(res.rows[0].pg_try_advisory_lock == true) return true;
    
                await sleep(100);
            }
        }

        throw Error("Cannot acquire lock")
    }

    async releaseLock(key: string): Promise<boolean>{
        let [classid, objid] = strToKey(key);
        await this.waitConnection();

        let res = await this.client.query(`
            SELECT pg_advisory_unlock($1, $2);
        `, [classid, objid]);

        return res.rows[0].pg_advisory_unlock;
    }

    end(){
        return this.client.end();
    }
}

async function initTable(client: Client, databasename: string): Promise<number>{
    let res = await client.query(`
        SELECT oid from pg_database WHERE datname=$1;
    `, [databasename]);
    if(res.rowCount == 0) 
        throw Error("Table does not exists!!");

    return res.rows[0].oid;
}

function strToKey(str: string){
    let buf = createHash("sha256").update(str).digest();
    return [buf.readInt32LE(0), buf.readInt32LE(4)];
}

function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}