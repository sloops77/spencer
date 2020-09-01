const error = require("./schemas/error.json");

/**
 * @typedef {'200'|'201'|'202'|'203'|'204'} SuccessCode
 * @typedef {{type: string, $id: string, properties: {error: {type: string}, message: {type: string}, statusCode: {type: string}}, additionalProperties: boolean}} HttpError
 * @typedef {{$schema?: string, type: string, description?: string, $id: string, properties?: any, allOf?: any[], oneOf?: any[], anyOf?: any[], additionalProperties?: boolean}} Schema
 */

/**
 * Creates response schemas
 * @template T extends {[successCode in SuccessCode]: Schema}
 * @param {T} success the success schema
 * @param {{notFound?: boolean, authenticated?: boolean}} options setting notFound generates a 404 response. setting authenticated generates 401 & 403 responses. default is true for both
 * @return {T & {400: HttpError, 500: HttpError, 404?: HttpError, 401?: HttpError, 403?: HttpError}}
 */
function responseSchemaBuilder(success, { notFound = true, authenticated = true } = {}) {
  /** @type {T & {400: HttpError, 500: HttpError, 404?: HttpError, 401?: HttpError, 403?: HttpError}} */
  const kinds = { ...success, 400: error, 500: error };
  if (notFound) {
    kinds[404] = error;
  }
  if (authenticated) {
    kinds[401] = error;
    kinds[403] = error;
  }
  return kinds;
}

module.exports = responseSchemaBuilder;
