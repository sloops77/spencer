const { ObjectID } = require("mongodb");
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
  ready
) {
  function collectionFn() {
    return mongoDb().collection(`${schemaName}.${name}`);
  }

  const table = Object.assign(collectionFn, {
    tableName: name,
    entityName,
    defaultProjection,
    timestampKeys,
    mutable,
    idKey: "_id",
    mockIdGenerator: () => ObjectID().toHexString(),
  });

  mongoClientPromise().then(ready).catch(ready);

  return table;
}

module.exports = init;
