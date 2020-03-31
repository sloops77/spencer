const _ = require("lodash/fp");
const uuidv1 = require("uuid/v1");

function register(name, table, baseFactory, dependencies) {
  const capitalizedName = `${_.capitalize(name[0])}${name.slice(1)}`;

  return {
    name,
    capitalizedName,
    [`new${capitalizedName}`]: newFactoryType(baseFactory, dependencies),
    [`created${capitalizedName}`]: createdFactoryType(baseFactory, dependencies),
    [`persist${capitalizedName}`]: persistFactoryType(baseFactory, table, dependencies),
  };
}

function newFactoryType(baseFactory, dependencies) {
  return (overrides = {}) =>
    baseFactory(overrides, ..._.map((dependency) => dependency[`new${dependency.capitalizedName}`], dependencies));
}

function createdFactoryType(baseFactory, dependencies) {
  return (overrides = {}) => {
    const objOrP = baseFactory(
      overrides,
      ..._.map((dependency) => dependency[`created${dependency.capitalizedName}`], dependencies)
    );

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

function persistFactoryType(baseFactory, table, dependencies) {
  return async (overrides = {}) =>
    JSON.parse(
      JSON.stringify(
        await table.insert(
          await baseFactory(
            overrides,
            ..._.map((dependency) => dependency[`persist${dependency.capitalizedName}`], dependencies)
          )
        )
      )
    );
}

module.exports = { register, createdFactoryType, persistFactoryType };
