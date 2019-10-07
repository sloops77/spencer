const _ = require("lodash/fp");
const initTable = require("../tables/table");
const initTableEffects = require(".");

const tableRegistry = {};
function tableEffectsFactory({ extensions, ...tableConfig }) {
  if (tableRegistry[tableConfig.name]) {
    return tableRegistry[tableConfig.name];
  }

  const tableEffects = initTableEffects(initTable(tableConfig), extensions);
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
  return _.mapValues(tableEffects => tableEffects(context), tableRegistry);
}

module.exports = {
  tableRegistry,
  clearTableRegistry,
  tableEffectsFactory,
  addContext
};
