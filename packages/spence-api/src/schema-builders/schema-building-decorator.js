const initSchemaBuilders = require("./schema-builders");
const responseSchemaBuilder = require("./response-schema-builder");

function schemaBuildingDecorator(sourcePlugin, { tag } = {}) {
  const schemaBuilders = initSchemaBuilders(tag);
  return (fastify, options, next) => {
    fastify.decorate("schemaBuilders", schemaBuilders);
    fastify.decorate("responseSchemasBuilder", responseSchemaBuilder);
    return sourcePlugin(fastify, options, next);
  };
}

module.exports = schemaBuildingDecorator;
