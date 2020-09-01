import {ObjectID} from "mongodb";

export interface Log {
    debug: Function,
    info: Function,
    warn: Function,
    error: Function,
}

export interface Context {
    log: Log,
    [key: string]: any,
}

export type Binary = 0 | 1;

export interface Projection {
    [key: string]: Binary
}

export interface Document {
    [key: string]: any
}

export interface CollectionConfig {
    name: string,
    entityName: string,
    schemaName: string,
    defaultProjection: Projection,
    mutable: boolean,
    timestampKeys: { createdAt: string, updatedAt: string }
}

export type Collection =
    (() => MongoCollection<Document>)
    & { idKey: string, entityName: string, defaultProjection: Projection, mutable: boolean, mockIdGenerator: (() => string), timestampKeys: { createdAt: string, updatedAt: string }, tableName: string }

export interface Query {
    filter?: object,
    limit?: number,
    offset?: number,
    skip?: number,
    orderBy?: [string, number][],
    sort?: [string, number][],

    [otherProps: string]: any
}
export function ExtensionFn<T extends RepoInstance, U extends T>(parent: T): U
export type Extension = typeof ExtensionFn;

export interface RepoInstance {
    /**
     * Deletes the document by id
     * @param id
     */
    del(id: string|ObjectID): Promise<string>,
    /**
     * Deletes the object using a query
     * @param query
     */
    delUsingFilter({ filter }: Query): Promise<string[]>,
    /**
     * Just modifies the updatedAt timestamp.
     * @param id
     * @param projection
     */
    touch(id: string|ObjectID, projection: Projection): Promise<Document>,

    /**
     * Finds a single document by id
     * @param id
     * @param projection
     */
    findById(id: string|ObjectID, projection?: Projection): Promise<Document>,
    /**
     * Finds a list of documents by using a query
     * @param query
     * @param projection
     * @returns {Promise<Document[]>}
     */
    find(query?: Query, projection?: Projection): Promise<Document[]>,
    /**
     * Finds a single document by using a query
     * @param query
     * @param projection
     */
    findOne({ filter, sort, }?: Query, projection?: Projection): Promise<Document | null>,
    /**
     * Counts the documents by using a query
     * @param query
     */
    count({ filter }: Query): Promise<number>,
    /**
     * Inserts a document into the collection
     * @param document
     * @param projection
     */
    insert(document: Document, projection?: Projection): Promise<Document>,
    /**
     * Inserts documents into the collection
     * @param documents
     * @param projection
     */
    insertMany(documents: Document[], projection?: Projection): Promise<Document[]>,
    /**
     * Finds a document by the natural key values in the passed document. If not found, then the document is inserted.
     * @param document
     * @param naturalKey
     * @param projection
     */
    findOrInsert(document: Document, naturalKey: string[], projection?: Projection): Promise<Document>,
    /**
     * Does an update by id
     * @param id
     * @param setStatement
     * @param projection
     */
    doUpdateById(id: string|ObjectID, setStatement: Document | (() => Document), projection?: Projection): Promise<Document>,
    /**
     * Does an update by id
     * @param id
     * @param val
     * @param projection
     */
    update(id: string|ObjectID, val: Document, projection?: Projection): Promise<Document>,
    /**
     * Does an update by filter
     * @param query
     * @param val
     * @param projection
     */
    updateUsingFilter({ filter }: Query, val: Document, projection?: Projection): Promise<Document[]>,
    /**
     * Upserts the value
     * @param id
     * @param val
     * @param projection
     */
    upsert(id: string|ObjectID, val: Document, projection?: Projection): Promise<Document>,
    readonly defaultColumnsSelection: Projection,
    collection: Collection,
    prepModification: import("./prep-modification").PrepModification,
    extensions: string[],
}

export type Repo = (context: Context) => RepoInstance

export type KindOfModification = "insert" | "update"

