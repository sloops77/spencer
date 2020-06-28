/* eslint-disable global-require */
const { repoFactory, addContext, ready, clearTableRegistry } = require("./repos/repo-registry");

module.exports = {
  ...require("./knex"),
  reposPlugin: require("./repos/repos-pre-handler"),
  initTable: require("./tables/table"),
  initRepo: require("./repos"),
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
