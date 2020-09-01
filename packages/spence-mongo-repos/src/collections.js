const { ObjectID } = require("mongodb");
const _ = require("lodash/fp");
const { mongoDb, mongoClientPromise } = require("./mongodb/mongodb-factory");
/**
 * @typedef { import("./types").Projection } Projection
 * @typedef { import("./types").CollectionConfig } CollectionConfig
 * @typedef { import("./types").Collection } Collection
 */

/**
 * Initializes a collection
 * @param {CollectionConfig} config
 * @param {() => void} ready
 * @returns {Collection}
 */
function init(
  {
    name,
    entityName,
    schemaName,
    defaultProjection,
    mutable = true,
    timestampKeys = { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
  ready
) {
  const collectionName = _.isEmpty(schemaName) ? name : `${schemaName}.${name}`;

  function collectionFn() {
    return mongoDb().collection(collectionName);
  }

  const table = Object.assign(collectionFn, {
    tableName: name,
    entityName,
    defaultProjection,
    timestampKeys,
    mutable,
    idKey: "_id",
    mockIdGenerator: () => new ObjectID().toHexString(),
  });

  mongoClientPromise()
    .then(() => ready())
    .catch(ready);

  return table;
}

module.exports = init;
