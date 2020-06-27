const mongodb = require("mongodb");
const mongoClientPromise = require("./mongodb");

const { ObjectID } = mongodb;

let mongoDb;

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
    if (mongoDb == null) {
      throw new Error("Mongodb not initialized yet. Wait for the ready() signal");
    }

    return mongoDb.collection(`${schemaName}.${name}`);
  }

  const table = Object.assign(collectionFn, {
    tableName: name,
    entityName,
    mongodb,
    defaultProjection,
    timestampKeys,
    mutable,
    idKey: "_id",
    mockIdGenerator: () => ObjectID().toHexString(),
  });

  mongoClientPromise.then(({ db }) => {
    mongoDb = db;
    ready();
  });

  return table;
}

module.exports = init;
