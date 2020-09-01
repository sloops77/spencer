export default init;
declare function init({ tag, schemas: { create: createSchema, update: updateSchema, reply: replySchema }, repo: repoParam, tableName }: {
    tag: any;
    schemas: {
        create: any;
        update: any;
        reply: any;
    };
    repo: any;
    tableName: any;
}, extend: any): (router: any, opts: any, next: any) => void;
