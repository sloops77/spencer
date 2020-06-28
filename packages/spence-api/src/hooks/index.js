/* eslint-disable global-require */
module.exports = {
  pgReposPreHandler: require("./pg-repos-pre-handler"),
  mongReposPreHandler: require("./mongo-repos-pre-handler"),
  tenantPreHandler: require("./tenant-pre-handler"),
};
