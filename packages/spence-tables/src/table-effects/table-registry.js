const _ = require("lodash/fp");
const { log } = require("@spencejs/spence-core");
const initTable = require("../tables/table");
const initTableEffects = require("./index");

const tableRegistry = {};
const waiting = {};
let readyCb;

function tableEffectsFactory({ extensions, ...tableConfig }) {
  if (tableRegistry[tableConfig.name]) {
    return tableRegistry[tableConfig.name];
  }

  const table = initTable(tableConfig, onTableReady(tableConfig.name));
  const tableEffects = initTableEffects(table, extensions);
  tableRegistry[tableConfig.name] = tableEffects;
  return tableEffects;
}

function clearTableRegistry() {
  // eslint-disable-next-line no-restricted-syntax
  for (const prop of Object.keys(tableRegistry)) {
    delete tableRegistry[prop];
  }
}

function addContext(context) {
  return _.mapValues((tableEffects) => tableEffects(context), tableRegistry);
}

function onTableReady(name) {
  waiting[name] = true;
  return (err) => {
    if (err) {
      waiting[name] = err;
      log.error(err);
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
  return _.size(tableRegistry) && _.isEmpty(waiting);
}

module.exports = {
  tableRegistry,
  clearTableRegistry,
  tableEffectsFactory,
  addContext,
  ready,
  isRegistryReady,
};
