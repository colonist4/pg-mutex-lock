# PG Mutex Lock

## Description

This is mutex lock implementation using postgres advisory lock feature.


## Feature

- Support multi-process mutex lock 
- Support single-process mutex lock 
- Support retry, timeout configuration
- Full typescript support


## API

### class PGMutexLock

This class is entry point of features. 
All functions are located under this class instance.

**Options**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|----|
| database.host | string | no | undefined | postgres database hostname |
| database.port | number | no | undefined | postgres database port |
| database.database | string | no | undefined | postgres database database name |
| database.user | string | no | undefined | postgres database user |
| database.password | string | no | undefined | postgres database password |
| timeout | number | no | 10 * 1000 | acquire lock timeout |
| retryCount | number | no | 3 | acquire lock retry count |

<br>

### Method acquireLock (key: string) : Promise<boolean>

Try to acquire lock for given key.
If success, will be resolved with true.
If failed, will be rejected.

<br>

### Method releaseLock (key: string) : Promise<boolean>

Try to release lock for given key.
It directly return results of pg_advisory_unlock.


## Dependencies

- pg (https://github.com/brianc/node-postgres)
