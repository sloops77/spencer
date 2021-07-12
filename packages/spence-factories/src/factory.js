const _ = require("lodash/fp");
const { v1: uuidv1 } = require("uuid");

function register(name, baseFactory) {
  const capitalizedName = `${_.capitalize(name[0])}${name.slice(1)}`;

  return {
    name,
    capitalizedName,
    [`new${capitalizedName}`]: async (...args) => {
      const { item } = await commonFactoryType(baseFactory, "created")(...args);
      return item;
    },
    [`created${capitalizedName}`]: createdFactoryType(baseFactory),
    [`persist${capitalizedName}`]: persistFactoryType(baseFactory),
  };
}

function commonFactoryType(baseFactory, itemType) {
  return (rawOverrides = {}) => {
    const manualProperties = [];

    async function getOrBuild(property, valFactory, ...valFactoryArgs) {
      if (rawOverrides[property] != null) {
        manualProperties.push(property);
        return rawOverrides[property];
      }
      if (_.isFunction(valFactory)) {
        return valFactory(...valFactoryArgs);
      }
      return valFactory[`${itemType}${valFactory.capitalizedName}`](...valFactoryArgs);
    }

    function overrides() {
      return _.pickBy((v, k) => v != null && !_.includes(k, manualProperties), rawOverrides);
    }

    return baseFactory(overrides, { getOrBuild }, rawOverrides);
  };
}

function createdFactoryType(baseFactory) {
  return async (overrides = {}) => {
    const { item, repo } = await commonFactoryType(baseFactory, "created")(overrides);
    const idKey = _.getOr("id", "collection.idKey", repo);
    const mockIdGenerator = _.getOr(uuidv1, "collection.mockIdGenerator", repo);
    const timestampKeys = _.getOr({ createdAt: "createdAt", updatedAt: "updatedAt" }, "collection.timestampKeys", repo);
    return {
      [idKey]: mockIdGenerator(),
      [timestampKeys.createdAt]: new Date().toISOString(),
      [timestampKeys.updatedAt]: new Date().toISOString(),
      ...item,
    };
  };
}

function persistFactoryType(baseFactory) {
  return async (overrides = {}) => {
    const { item, repo } = await commonFactoryType(baseFactory, "persist")(overrides);
    const value = await repo.insert(item);
    return JSON.parse(JSON.stringify(value));
  };
}

module.exports = { register };
