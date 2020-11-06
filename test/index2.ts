import PGMutexLock from '../src'

const mutex = new PGMutexLock({
    database: {
        database: "temp",
        host: "127.0.0.1",
        user: "admin",
        password: "test",
        port: 5432
    }
})

mutex.acquireLock("test")
.then(() => mutex.releaseLock("test"))
.then(console.log)
.then(mutex.end)