export const log: import("./log").Log;
export const env: {
    nodeEnv: string;
    debug: boolean;
    dbName: string;
    dbNamePrefix: string;
    pgConnection: string;
    mongoConnection: string;
    source: string;
};
