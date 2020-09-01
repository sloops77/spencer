export default handlers;

declare type Handlers = {
    create: {
        method: string;
        path: string;
        schema({ schemas: { createSchema, replySchema }, schemaBuilders: { insertOne } }: {
            schemas: {
                createSchema: any;
                replySchema: any;
            };
            schemaBuilders: {
                insertOne: any;
            };
        }): any;
        handler({ repo }: {
            repo: any;
        }): (req: any, reply: any) => Promise<void>;
    };
    getById: {
        method: string;
        path: string;
        schema({ schemas: { replySchema }, schemaBuilders: { findOne } }: {
            schemas: {
                replySchema: any;
            };
            schemaBuilders: {
                findOne: any;
            };
        }): any;
        handler({ repo }: {
            repo: any;
        }): (req: any, reply: any) => Promise<void>;
    };
    getAll: {
        method: string;
        path: string;
        schema({ schemas: { replySchema }, schemaBuilders: { findMany } }: {
            schemas: {
                replySchema: any;
            };
            schemaBuilders: {
                findMany: any;
            };
        }): any;
        handler({ repo }: {
            repo: any;
        }): (req: any, reply: any) => Promise<void>;
    };
    del: {
        method: string;
        path: string;
        schema({ schemaBuilders: { deleteOne } }: {
            schemaBuilders: {
                deleteOne: any;
            };
        }): any;
        handler({ repo }: {
            repo: any;
        }): (req: any, reply: any) => Promise<void>;
    };
    update: {
        method: string;
        path: string;
        schema({ schemas: { updateSchema, replySchema }, schemaBuilders: { updateOne } }: {
            schemas: {
                updateSchema: any;
                replySchema: any;
            };
            schemaBuilders: {
                updateOne: any;
            };
        }): any;
        handler({ repo }: {
            repo: any;
        }): (req: any, reply: any) => Promise<void>;
    };
};

declare const handlers: Handlers;
