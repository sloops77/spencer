const _ = require("lodash/fp");
const initTable = require("../tables/table");
const initRepo = require("./index");

const repoRegistry = {};
const waiting = {};
let readyCb;

function repoFactory({ extensions, ...tableConfig }, context) {
  if (repoRegistry[tableConfig.name]) {
    return repoRegistry[tableConfig.name];
  }

  const table = initTable(tableConfig, onTableReady(tableConfig.name, context));
  const repo = initRepo(table, extensions);
  repoRegistry[tableConfig.name] = repo;
  return repo;
}

function clearTableRegistry() {
  // eslint-disable-next-line no-restricted-syntax
  for (const prop of Object.keys(repoRegistry)) {
    delete repoRegistry[prop];
  }
}

function addContext(context) {
  return _.mapValues((repo) => repo(context), repoRegistry);
}

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
