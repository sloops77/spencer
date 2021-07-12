const _ = require("lodash/fp");
const { v1: uuidv1 } = require("uuid");

function register(name, ...args) {
  let defaultRepo;
  let baseFactory;
  if (args.length === 1) {
    baseFactory = args[0];
  } else {
    defaultRepo = args[0];
    baseFactory = args[1];
  }

  const capitalizedName = `${_.capitalize(name[0])}${name.slice(1)}`;

  const commonFactory = commonFactoryType(baseFactory, defaultRepo);

  return {
    name,
    capitalizedName,
    [`new${capitalizedName}`]: async (...args) => {
      const { item } = await commonFactory("created")(...args);
      return item;
    },
    [`created${capitalizedName}`]: createdFactoryType(commonFactory),
    [`persist${capitalizedName}`]: persistFactoryType(commonFactory),
  };
}

function commonFactoryType(baseFactory, defaultRepo) {
  return (itemType) => async (rawOverrides = {}) => {
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

    const val = await baseFactory(overrides, { getOrBuild }, rawOverrides);
    if (val.repo) {
      return val;
    }

    return { item: val, repo: defaultRepo };
  };
}

function createdFactoryType(commonFactory, defaultRepo) {
  return async (overrides = {}) => {
    const { item, repo } = await commonFactory("created")(overrides);
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

function persistFactoryType(commonFactory, defaultRepo) {
  return async (overrides = {}) => {
    const { item, repo } = await commonFactory("persist")(overrides);
    const value = await repo.insert(item);
    return JSON.parse(JSON.stringify(value));
  };
}

module.exports = { register };
