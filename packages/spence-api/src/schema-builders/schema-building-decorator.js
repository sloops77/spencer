const initSchemaBuilders = require("./schema-builders");
const responseSchemaBuilder = require("./response-schema-builder");

function schemaBuildingDecorator(sourcePlugin, { tag } = {}) {
  const schemaBuilders = initSchemaBuilders(tag);
  return (fastify, options, next) => {
    // eslint-disable-next-line no-param-reassign
    options.schemaBuilders = schemaBuilders;
    // eslint-disable-next-line no-param-reassign
    options.responseSchemasBuilder = responseSchemaBuilder;
    return sourcePlugin(fastify, options, next);
  };
}

module.exports = schemaBuildingDecorator;
