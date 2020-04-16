/* eslint-disable global-require */
const initTable = require("./tables/table");
const initTableEffects = require("./table-effects");
const { tableEffectsFactory, addContext, ready, clearTableRegistry } = require("./table-effects/table-registry");

module.exports = {
  knex: require("./knex"),
  initTable,
  initTableEffects,
  tableEffectsFactory,
  ready,
  bindTableEffects: addContext,
  createSchema: require("./tables/schemas").createSchema,
  dropSchema: require("./tables/schemas").dropSchema,
  softDeleteExtension: require("./table-effects/soft-delete-extension"),
  multiTenantExtension: require("./table-effects/multi-tenant-extension"),
  findConnectionsExtension: require("./table-effects/find-connections-extension"),
  clearTableRegistry,
};
