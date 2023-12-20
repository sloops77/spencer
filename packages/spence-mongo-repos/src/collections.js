const { ObjectId } = require("mongodb");
const _ = require("lodash/fp");
const { mongoDb, mongoClientPromise } = require("./mongodb/mongodb-factory");

function init(
  {
    name,
    entityName,
    schemaName,
    defaultProjection,
    mutable = true,
    timestampKeys = { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
  ready,
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
    mockIdGenerator: () => new ObjectId().toHexString(),
  });

  mongoClientPromise()
    .then(() => ready())
    .catch(ready);

  return table;
}

module.exports = init;
