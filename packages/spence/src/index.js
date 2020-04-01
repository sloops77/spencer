/* eslint-disable global-require */
const events = require("./events/events");
const initTable = require("./tables/table");
const initTableEffects = require("./table-effects");
const { tableEffectsFactory, addContext } = require("./table-effects/table-registry");

module.exports = {
  log: require("./log"),
  knex: require("./knex"),
  initTable,
  initTableEffects,
  tableEffectsFactory,
  bindTableEffects: addContext,
  initController: require("./rest/controller"),
  subscribe: events.subscribe,
  publish: events.publish,
  initEvents({ errorHandler, log }) {
    events.setErrorHandler(errorHandler);
    events.setLog(log);
  },
  newError: require("./new-error"),
  fastifyRest: require("./rest/plugin"),
  createSchema: require("./tables/schemas").createSchema,
  dropSchema: require("./tables/schemas").dropSchema,
  tenantPreHandler: require("./hooks/tenant-pre-handler"),
  tablesPreHandler: require("./hooks/tables-pre-handler"),
  softDeleteExtension: require("./table-effects/soft-delete-extension"),
  multiTenantExtension: require("./table-effects/multi-tenant-extension"),
  findConnectionsExtension: require("./table-effects/find-connections-extension"),
};
