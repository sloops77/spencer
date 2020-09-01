const _ = require("lodash/fp");
const initCollection = require("../collections");
const initRepo = require("./repo");

/**
 * @typedef { import("../types").Context } Context
 * @typedef { import("../types").CollectionConfig } CollectionConfig
 * @typedef { import("../types").Repo } Repo
 * @typedef { import("../types").RepoInstance } RepoInstance
 * @typedef { import("../types").Extension } Extension
 */

/** @type {{[name: string]: Repo}} */
const repoRegistry = {};
/** @type {{[name: string]: boolean}} */
const waiting = {};
/** @type {(err?: Error) => void} */
let readyCb;

/**
 * @param {{ extensions: Extension[]} & CollectionConfig } config
 * @param {Context} context
 * @returns {Repo}
 */
function repoFactory({ extensions, ...collectionConfig }, context) {
  if (repoRegistry[collectionConfig.name]) {
    return repoRegistry[collectionConfig.name];
  }

  const collection = initCollection(collectionConfig, onTableReady(collectionConfig.name, context));
  const repo = initRepo({ collection, extensions });
  repoRegistry[collectionConfig.name] = repo;
  return repo;
}

function clearTableRegistry() {
  // eslint-disable-next-line no-restricted-syntax
  for (const prop of Object.keys(repoRegistry)) {
    delete repoRegistry[prop];
  }
}

/**
 * Adds context to the collection
 * @param {Context} context
 * @returns {{[key: string]: RepoInstance}}
 */
function addContext(context) {
  return _.mapValues((repo) => repo(context), repoRegistry);
}

/**
 * Calls the ready callback when appropriate
 * @param {string} name
 * @param {Context} context
 */
function onTableReady(name, context) {
  waiting[name] = true;
  return (err) => {
    if (err) {
      waiting[name] = err;
      _.invokeArgs("log.error", [err], context);
      if (readyCb != null) {
        readyCb(err);
      }

      return;
    }
    delete waiting[name];
    checkRegistryReady();
  };
}

/**
 *
 * @param {(err?: Error) => void} cb
 * @returns {Promise<undefined>|undefined}
 */
function ready(cb) {
  if (cb == null) {
    return new Promise((resolve, reject) => {
      ready((err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  if (isRegistryReady()) {
    cb();
    return undefined;
  }

  readyCb = cb;
  return undefined;
}

function checkRegistryReady() {
  if (isRegistryReady()) {
    if (readyCb != null) {
      readyCb();
    }
  }
}

function isRegistryReady() {
  return _.size(repoRegistry) && _.isEmpty(waiting);
}

module.exports = {
  tableRegistry: repoRegistry,
  clearTableRegistry,
  repoFactory,
  addContext,
  ready,
  isRegistryReady,
};
