import {Db, MongoClient} from "mongodb";
import {Log} from "../types";

export function mongoFactory({ log, config: { nodeEnv, mongoConnection, debug } }: {
    log: Log;
    config: {
        nodeEnv: string;
        mongoConnection: string;
        debug: boolean;
    };
}, ready: (err?: Error) => void): Promise<MongoClient>;
export function mongoClient(): MongoClient;
export function mongoDb(): Db;
export function mongoClose(): Promise<void>;
export function mongoClientPromise(): Promise<MongoClient>;
