/* eslint-disable global-require */
module.exports = {
  fastifyRest: require("./rest/plugin"),
  initController: require("./rest/controller"),
  handlers: require("./rest/rest-handlers"),
  responses: require("./rest/responses"),
  tenantPreHandler: require("./hooks/tenant-pre-handler"),
  reposPreHandler: require("./hooks/repos-pre-handler"),
  schemas: {
    idParam: require("./rest/schemas/id-param"),
    error: require("./rest/schemas/error"),
    immutableEntity: require("./rest/schemas/immutable-entity"),
    mutableEntity: require("./rest/schemas/mutable-entity"),
  },
};
