/* eslint-disable global-require */
const events = require("./events/events");
const initTable = require("./tables/table");
const initTableEffects = require("./table-effects");
const { tableEffectsFactory, addContext, ready } = require("./table-effects/table-registry");

module.exports = {
  log: require("./log"),
  knex: require("./knex"),
  initTable,
  initTableEffects,
  tableEffectsFactory,
  ready,
  bindTableEffects: addContext,
  initController: require("./rest/controller"),
  subscribe: events.subscribe,
  publish: events.publish,
  initEvents({ errorHandler, log }) {
    events.setErrorHandler(errorHandler);
    events.setLog(log);
  },
  fastifyRest: require("./rest/plugin"),
  createSchema: require("./tables/schemas").createSchema,
  dropSchema: require("./tables/schemas").dropSchema,
  tenantPreHandler: require("./hooks/tenant-pre-handler"),
  tablesPreHandler: require("./hooks/tables-pre-handler"),
  softDeleteExtension: require("./table-effects/soft-delete-extension"),
  multiTenantExtension: require("./table-effects/multi-tenant-extension"),
  findConnectionsExtension: require("./table-effects/find-connections-extension"),
  testing: {
    disconnectEvents: events.disconnect,
    connectEvents: events.connect,
  },
  schemas: {
    idParam: require("./rest/schemas/id-param"),
    error: require("./rest/schemas/error"),
    immutableEntity: require("./rest/schemas/immutable-entity"),
    mutableEntity: require("./rest/schemas/mutable-entity"),
  },
  handlers: require("./rest/rest-handlers"),
};
