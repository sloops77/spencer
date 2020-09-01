/**
 * @typedef {{$schema?: string, type: string, $id: string, properties: {id: {type: string}}}} IdSchema
 * @typedef {{$schema?: string, type: string, $id: string, properties: {error: {type: string}, message: {type: string}, statusCode: {type: string}}, additionalProperties: boolean}} HttpError
 * @typedef {{$schema?: string, type: string, description?: string, $id: string, properties?: any, allOf?: any[], oneOf?: any[], anyOf?: any[], additionalProperties?: boolean}} Schema
 */

const _ = require("lodash/fp");
const idParam = require("./schemas/id-param.json");
const responses = require("./response-schema-builder");

/**
 * Builds a schema for the specific tag
 * @param {string | null | undefined} tag
 * @return {{responses: responseSchemaBuilder, idParam: IdSchema}}
 */
function init(tag) {
  /**
   * @template T
   * @param {T} base
   * @return {T & {tags?: string[]}}
   */
  function tagify(base) {
    if (tag == null) {
      return base;
    }

    return Object.assign(base, { tags: [tag] });
  }

  /**
   * @template U extends Schema
   * @param {U} result
   * @return {{params: IdSchema, response: ({200: U, 400: HttpError, 500: HttpError, 404?: HttpError, 401?: HttpError, 403?: HttpError})}}
   */
  function findOne(result) {
    return { params: idParam, response: responses({ 200: result }) };
  }

  /**
   * @template U extends Schema
   * @template V
   * @param {U} result
   * @params {V} overrides
   * @return {V & {querystring: {limit: { type: "number" }, offset: { type: "number" }}, response: ({200: { type: "array", items: U }, 400: HttpError, 500: HttpError, 404?: HttpError, 401?: HttpError, 403?: HttpError})}}
   */
  function findMany(result, overrides = {}) {
    return _.defaultsDeep(overrides, {
      querystring: { limit: { type: "number" }, offset: { type: "number" } },
      response: responses({ 200: { type: "array", items: result } }),
    });
  }

  /**
   * @template T extends Schema
   * @template U extends Schema
   * @param {T} body
   * @param {U} result
   * @return {{body: T, response: ({201: U, 400: HttpError, 500: HttpError, 401?: HttpError, 403?: HttpError})}}
   */
  function insertOne(body, result) {
    return { body, response: responses({ 201: result }, { notFound: false }) };
  }

  /**
   * @template T extends Schema
   * @template U extends Schema
   * @param {T} body
   * @param {T | U} result
   * @return {{params: IdSchema, body: T, response: ({200: T|U, 400: HttpError, 500: HttpError, 404?: HttpError, 401?: HttpError, 403?: HttpError})}}
   */
  function updateOne(body, result = body) {
    return { params: idParam, body, response: responses({ 200: result }) };
  }

  /**
   * @return {{params: IdSchema, response: ({204: {type: "null", description: string}, 400: HttpError, 500: HttpError, 404?: HttpError, 401?: HttpError, 403?: HttpError})}}
   */
  function deleteOne() {
    return {
      params: idParam,
      response: responses({ 204: { type: "null", description: "Successfully deleted item" } }),
    };
  }

  return {
    ..._.mapValues((fn) => _.flow(fn, tagify), { insertOne, findOne, updateOne, deleteOne, findMany }),
    responses,
    idParam,
  };
}

module.exports = init;
