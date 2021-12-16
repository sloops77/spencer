/* eslint-disable global-require */
const { repoFactory, addContext, ready, clearTableRegistry, tableRegistry } = require("./repos/repo-registry");
const autoboxIdsExtension = require("./extensions/autoboxIdsExtension");

module.exports = {
  ...require("./mongodb"),
  reposPlugin: require("./repos/repos-pre-handler"),
  initCollection: require("./collections"),
  initRepo: require("./repos/repo"),
  repoFactory,
  ready,
  bindRepo: addContext,
  tableRegistry,
  clearTableRegistry,
  autoboxIdsExtension,
};
