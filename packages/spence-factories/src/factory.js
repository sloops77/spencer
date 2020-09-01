const _ = require("lodash/fp");
const { v1: uuidv1 } = require("uuid");

function register(name, repo, baseFactory) {
  const capitalizedName = `${_.capitalize(name[0])}${name.slice(1)}`;

  return {
    name,
    capitalizedName,
    [`new${capitalizedName}`]: commonFactoryType(baseFactory, "created"),
    [`created${capitalizedName}`]: createdFactoryType(baseFactory, repo),
    [`persist${capitalizedName}`]: persistFactoryType(baseFactory, repo),
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

function createdFactoryType(baseFactory, repo) {
  return (overrides = {}) => {
    const objOrP = commonFactoryType(baseFactory, "created")(overrides);
    const idKey = _.getOr("id", "collection.idKey", repo);
    const mockIdGenerator = _.getOr(uuidv1, "collection.mockIdGenerator", repo);
    const timestampKeys = _.getOr({ createdAt: "createdAt", updatedAt: "updatedAt" }, "collection.timestampKeys", repo);

    if (objOrP.then) {
      return objOrP.then((obj) => ({
        [idKey]: mockIdGenerator(),
        [timestampKeys.createdAt]: new Date().toISOString(),
        [timestampKeys.updatedAt]: new Date().toISOString(),
        ...obj,
      }));
    }

    return {
      [idKey]: mockIdGenerator(),
      [timestampKeys.createdAt]: new Date().toISOString(),
      [timestampKeys.updatedAt]: new Date().toISOString(),
      ...objOrP,
    };
  };
}

function persistFactoryType(baseFactory, repo) {
  return async (overrides = {}) =>
    JSON.parse(JSON.stringify(await repo.insert(await commonFactoryType(baseFactory, "persist")(overrides))));
}

module.exports = { register };
