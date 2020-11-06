import { Client } from 'pg';
import assert from 'assert';

type ConnectionInfo = {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
}

export function createClient({
    host, port, database, user, password
}: ConnectionInfo){

    host = host || process.env.PGHOST;
    port = port || Number(process.env.PGPORT);
    database = database || process.env.PGDATABASE;
    user = user || process.env.PGUSER;
    password = password || process.env.PGPASSWORD;

    assert(host != undefined, "PGHOST is required");
    assert(port != undefined && !Number.isNaN(port), "PGPORT is required");
    assert(database != undefined, "PGDATABASE is required");
    assert(user != undefined, "PGUSER is required");
    assert(password != undefined, "PGPASSWORD is required");

    const client = new Client({
        host,
        port,
        database,
        password,
        user
    })

    return client;
}