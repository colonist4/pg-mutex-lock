import assert from 'assert';
import PgMutexLock from "../src";


process.env.PGHOST = 

process.env.PGHOST = "127.0.0.1"
process.env.PGPORT = "5432"
process.env.PGDATABASE = "temp"
process.env.PGUSER = "admin"
process.env.PGPASSWORD = "test"

const mutexLock = new PgMutexLock();

(async function main(){
    await lockWithSameKey()

    mutexLock.end();
})()
.then(()=>{})
.catch(console.error)


async function lockWithSameKey(){
    let p = await Promise.all([
        LockNReleaseTimeout("key", 2000, 1),
        LockNReleaseTimeout("key", 2000, 2)
    ])
    assert(+p[0].releasedTime < +p[1].lockedTime, "lockWithSameKey")
}



function LockNReleaseTimeout(key: string, time: number, id: number): Promise<{
    lockedTime: Date,
    releasedTime: Date
}> {
    return new Promise(async (resolve) => {
        await mutexLock.acquireLock(key);
        let lockedTime = new Date();
        console.log(`LOCK!! ${key} (id: ${id})`)
    
        setTimeout(async ()=>{
            await mutexLock.releaseLock(key);
            console.log(`RELEASE!! ${key} (id: ${id})`)
            let releasedTime = new Date();
            resolve({
                lockedTime,
                releasedTime
            });
        }, time)
    })
}