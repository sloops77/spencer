const _ = require("lodash/fp");
const uuidv1 = require("uuid/v1");

function register(name, table, baseFactory, dependencies) {
  const capitalizedName = `${_.capitalize(name[0])}${name.slice(1)}`;

  return {
    name,
    capitalizedName,
    [`new${capitalizedName}`]: commonFactoryType(baseFactory, "new"),
    [`created${capitalizedName}`]: createdFactoryType(baseFactory, dependencies),
    [`persist${capitalizedName}`]: persistFactoryType(baseFactory, table, dependencies),
  };
}

function commonFactoryType(baseFactory, itemType) {
  return (rawOverrides = {}) => {
    const manualProperties = [];

    async function getOrBuild(property, valFactory) {
      if (rawOverrides[property] != null) {
        manualProperties.push(property);
        return rawOverrides[property];
      }
      if (_.isFunction(valFactory)) {
        return valFactory(overrides);
      }
      return valFactory[`${itemType}${valFactory.capitalizedName}`](overrides());
    }

    function overrides() {
      return _.omit(manualProperties, rawOverrides);
    }

    return baseFactory(overrides, getOrBuild, rawOverrides);
  };
}

function createdFactoryType(baseFactory) {
  return (overrides = {}) => {
    const objOrP = commonFactoryType(baseFactory, "created")(overrides);

    if (objOrP.then) {
      return objOrP.then((obj) => ({
        id: uuidv1(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...obj,
      }));
    }

    return {
      id: uuidv1(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...objOrP,
    };
  };
}

function persistFactoryType(baseFactory, table) {
  return async (overrides = {}) =>
    JSON.parse(JSON.stringify(await table.insert(await commonFactoryType(baseFactory, "persist")(overrides))));
}

module.exports = { register, createdFactoryType, persistFactoryType, commonFactoryType };
