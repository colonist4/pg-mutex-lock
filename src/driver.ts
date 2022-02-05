import { Client } from 'pg';

type ClientConstructorParams = ConstructorParameters<typeof Client>[0]

export function createClient(params: ClientConstructorParams){

    const client = new Client(params)
    return client;
}