/* eslint-disable global-require */
module.exports = {
  initController: require("./rest/controller"),
  fastifyRest: require("./rest/plugin"),
  tenantPreHandler: require("./hooks/tenant-pre-handler"),
  tablesPreHandler: require("./hooks/tables-pre-handler"),
  schemas: {
    idParam: require("./rest/schemas/id-param"),
    error: require("./rest/schemas/error"),
    immutableEntity: require("./rest/schemas/immutable-entity"),
    mutableEntity: require("./rest/schemas/mutable-entity"),
  },
  handlers: require("./rest/rest-handlers"),
};
