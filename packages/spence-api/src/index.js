/* eslint-disable global-require */
module.exports = {
  fastifyRest: require("./rest/plugin"),
  initController: require("./rest/controller"),
  handlers: require("./rest/rest-handlers"),
  responses: require("./schema-builders/response-schema-builder"),
  tenantPreHandler: require("./hooks/tenant-pre-handler"),
  reposPreHandler: require("./hooks/pg-repos-pre-handler"),
  schemas: {
    idParam: require("./schema-builders/schemas/id-param"),
    error: require("./schema-builders/schemas/error"),
    immutableEntity: require("./schema-builders/schemas/immutable-entity"),
    mutableEntity: require("./schema-builders/schemas/mutable-entity"),
  },
};
