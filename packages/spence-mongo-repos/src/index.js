const { log } = require("@spencejs/spence-core");
const initCollection = require("./collections");
const initRepo = require("./repos/repo");
const mongoClientPromise = require("./mongodb");
const { repoFactory, addContext, ready, clearTableRegistry } = require("./repos/repo-registry");

let localMongoClient = null;
function getMongoClient() {
  return localMongoClient;
}

mongoClientPromise
  .then(({ mongoClient }) => {
    localMongoClient = mongoClient;
  })
  .catch((err) => log.error(err));

module.exports = {
  getMongoClient,
  initCollection,
  initRepo,
  repoFactory,
  ready,
  bindRepo: addContext,
  clearTableRegistry,
};
