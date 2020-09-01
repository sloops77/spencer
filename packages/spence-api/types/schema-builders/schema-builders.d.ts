export default initSchemaBuilders;

import {IdSchema, Schema} from "../types";
import {ResponseSchemaBuilder, ErrorResponses} from "./response-schema-builder";

declare interface SchemaBuilders {
    insertOne<T extends Schema, U extends Schema>(body: T, result: U): { body: T, response: ({ 201: U } & ErrorResponses), tags?: string[] }

    findOne<U extends Schema>(result: U): { params: IdSchema, response: ({ 200: U } & ErrorResponses), tags?: string[] }

    findMany<U extends Schema, V>(result: U, overrides: V): V & { querystring: { limit: { type: "number" }, offset: { type: "number" } }, response: ({ 200: { type: "array", items: U } } & ErrorResponses), tags?: string[] }

    updateOne<T extends Schema, U extends Schema>(body: T, result: T | U): { params: IdSchema, body: T, response: ({ 200: T | U } & ErrorResponses), tags?: string[] }

    deleteOne(): { params: IdSchema, response: ({ 204: { type: "null", description: string } } & ErrorResponses), tags?: string[] }
}

/**
 * Builds a schema for the specific tag
 * @param tag
 */
declare function initSchemaBuilders(tag: string | null | undefined): {
    responses: ResponseSchemaBuilder;
    idParam: IdSchema;
} & SchemaBuilders;
