/* eslint-disable global-require */
module.exports = {
  fastifySchemaBuilders: require("./plugin"),
  schemaBuildingDecorator: require("./schema-building-decorator"),
  initSchemaBuilders: require("./schema-builders"),
};
