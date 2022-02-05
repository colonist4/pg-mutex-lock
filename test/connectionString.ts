import assert from 'assert';
import PGMutexLock from "../src";

const mutexLock = new PGMutexLock({
    database: 'postgresql://admin:test@localhost/temp'
});

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