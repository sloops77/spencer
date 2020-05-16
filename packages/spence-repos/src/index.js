/* eslint-disable global-require */
const initTable = require("./tables/table");
const initRepo = require("./repos");
const { repoFactory, addContext, ready, clearTableRegistry } = require("./repos/repo-registry");

module.exports = {
  knex: require("./knex"),
  initTable,
  initRepo,
  repoFactory,
  ready,
  bindRepo: addContext,
  createSchema: require("./tables/schemas").createSchema,
  dropSchema: require("./tables/schemas").dropSchema,
  softDeleteExtension: require("./repos/soft-delete-extension"),
  multiTenantExtension: require("./repos/multi-tenant-extension"),
  findConnectionsExtension: require("./repos/find-connections-extension"),
  clearTableRegistry,
};
