import {Collection as MongoCollection} from "mongodb";
import {Document, Projection} from "./types";

declare function init(collectionConfig: CollectionConfig, ready: () => void): Collection;

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

export default init;