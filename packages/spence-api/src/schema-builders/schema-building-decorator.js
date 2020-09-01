const initSchemaBuilders = require("./schema-builders");
const responseSchemaBuilder = require("./response-schema-builder");

/**
 * @param {(app: import("fastify").FastifyInstance<import("http").Server, import("http").IncomingMessage, import("http").ServerResponse>, options: any, next: (err?: import("fastify").FastifyError) => void) => void} sourcePlugin
 * @param {{tag?: string}} options
 * @return {(app: import("fastify").FastifyInstance<import("http").Server, import("http").IncomingMessage, import("http").ServerResponse>, options: any, next: (err?: import("fastify").FastifyError) => void) => void}
 */
function schemaBuildingDecorator(sourcePlugin, { tag } = {}) {
  const schemaBuilders = initSchemaBuilders(tag);
  return (fastify, options, next) => {
    fastify.decorate("schemaBuilders", schemaBuilders);
    fastify.decorate("responseSchemasBuilder", responseSchemaBuilder);
    return sourcePlugin(fastify, options, next);
  };
}

module.exports = schemaBuildingDecorator;
