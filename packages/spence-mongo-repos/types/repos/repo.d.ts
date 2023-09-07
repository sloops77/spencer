import {Context, Projection, Document} from "../types";
import {Collection} from "../collections";
import { ObjectId } from "mongodb";

export default init;

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
     * @param {string|ObjectId} id
     * @returns {Promise<string>} the deleted id
     */
    del(id: string|ObjectId): Promise<string>,
    /**
     * Deletes the object using a query
     * @param query
     * @returns the deleted ids
     */
    delUsingFilter({ filter }: Query): Promise<string[]>,
    /**
     * Just modifies the updatedAt timestamp.
     * @param {string|ObjectId} id
     * @param {Projection} projection
     * @returns {Promise<Document>}
     */
    touch(id: string|ObjectId, projection: Projection): Promise<Document>,

    /**
     * Finds a single document by id
     * @param {string|ObjectId} id
     * @param {Projection} projection
     * @returns {Promise<Document>}
     */
    findById(id: string|ObjectId, projection?: Projection): Promise<Document>,
    /**
     * Finds a list of documents by using a query
     * @param {Query} query
     * @param {Projection} projection
     * @returns {Promise<Document[]>}
     */
    find(query?: Query, projection?: Projection): Promise<Document[]>,
    /**
     * Finds a single document by using a query
     * @param {Query} query
     * @param {Projection} projection
     * @returns {Promise<Document | null>}
     */
    findOne({ filter, sort, }?: Query, projection?: Projection): Promise<Document | null>,
    /**
     * Counts the documents by using a query
     * @param {Query} query
     * @returns {Promise<number>}
     */
    count({ filter }: Query): Promise<number>,
    /**
     * Inserts a document into the collection
     * @param {Document} document
     * @param {Projection} projection
     * @returns {Promise<Document>}
     */
    insert(document: Document, projection?: Projection): Promise<Document>,
    /**
     * Inserts documents into the collection
     * @param {Document[]} documents
     * @param {Projection} projection
     * @returns {Promise<Document[]>}
     */
    insertMany(documents: Document[], projection?: Projection): Promise<Document[]>,
    /**
     * Finds a document by the natural key values in the passed document. If not found, then the document is inserted.
     * @param {Document} document
     * @param {string[]} naturalKey
     * @param {Projection} projection
     * @returns {Promise<Document>}
     */
    findOrInsert(document: Document, naturalKey: string[], projection?: Projection): Promise<Document>,
    /**
     * Does an update by id
     * @param {string|ObjectId} id
     * @param {Document | (() => Document)} setStatement
     * @param {Projection} projection
     * @returns {Promise<Document>}
     */
    doUpdateById(id: string|ObjectId, setStatement: Document | (() => Document), projection?: Projection): Promise<Document>,
    /**
     * Does an update by id
     * @param {string|ObjectId} id
     * @param {Document} val
     * @param {Projection} projection
     * @returns {Promise<Document>}
     */
    update(id: string|ObjectId, val: Document, projection?: Projection): Promise<Document>,
    /**
     * Does an update by filter
     * @param {Query} query
     * @param {Document} val
     * @param {Projection} projection
     * @returns {Promise<Document[]>}
     */
    updateUsingFilter({ filter }: Query, val: Document, projection?: Projection): Promise<Document[]>,
    /**
     * Upserts the value
     * @param {string|ObjectId} id
     * @param {Document} val
     * @param {Projection} projection
     * @returns {Promise<Document>}
     */
    upsert(id: string|ObjectId, val: Document, projection?: Projection): Promise<Document>,
    readonly defaultColumnsSelection: Projection,
    collection: Collection,
    prepModification: import("./prep-modification").PrepModification,
    extensions: string[],
}

export type Repo = (context: Context) => RepoInstance

declare function init({ collection, extensions }: {
    collection: import("../collections").Collection;
    extensions: Extension[];
}): Repo;
