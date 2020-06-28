/* eslint-disable global-require */
const { repoFactory, addContext, ready, clearTableRegistry } = require("./repos/repo-registry");

module.exports = {
  ...require("./mongodb"),
  initCollection: require("./collections"),
  initRepo: require("./repos/repo"),
  repoFactory,
  ready,
  bindRepo: addContext,
  clearTableRegistry,
};
