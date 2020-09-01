const { MongoClient, Logger } = require("mongodb");

/**
 * @typedef { import("mongodb").Db } Db
 * @typedef { import("../types").Log} Log
 */

/** @type {MongoClient|null} */
let mongoClientInstance = null;

/** @type {Promise<MongoClient>|null} */
let mongoClientPromiseInstance = null;

/** @type {string | null} */
let lastConnection = null;

/** @type {() => Promise<MongoClient>} */
function mongoClientPromise() {
  if (mongoClientPromiseInstance == null) {
    throw new Error(`Mongo not initialized yet. Call mongoFactory() before using mongoClientPromise()`);
  }

  return mongoClientPromiseInstance;
}

/** @type {() => MongoClient} */
function mongoClient() {
  if (mongoClientInstance == null) {
    throw new Error(
      `Mongo not initialized yet. Call and await mongoFactory() before using mongoClient(), mongoDb() or mongoClose()`
    );
  }

  return mongoClientInstance;
}

/** @type {() => Db} */
function mongoDb() {
  return mongoClient().db();
}

/** @type {() => Promise<void>} */
function mongoClose() {
  lastConnection = null;
  return mongoClient().close();
}

/** @type {({ log, config: { nodeEnv, mongoConnection, debug } }: {log: Log; config: any}, ready: (err?: Error) => void) => Promise<MongoClient>} */
function mongoFactory({ log, config: { nodeEnv, mongoConnection, debug } }, ready) {
  if (mongoConnection === lastConnection) {
    throw new Error(
      `Initializing mongo twice to ${mongoConnection} is not possible. Please remove one of the initializations`
    );
  }
  lastConnection = mongoConnection;

  const maxPool = nodeEnv !== "test" ? 10 : 1;

  // create a client, passing in additional options
  const client = new MongoClient(mongoConnection, {
    poolSize: maxPool,
    tls: !["test", "development"].includes(nodeEnv),
  });

  Logger.setLevel(debug ? "debug" : "info");

  Logger.setCurrentLogger((msg, context) => {
    log.info(context, msg);
  });

  // Logger.filter('class', ['Db']);

  // Use connect method to connect to the server
  mongoClientPromiseInstance = client
    .connect()
    .then((connectedClient) => {
      mongoClientInstance = connectedClient;
      ready();
      return mongoClientInstance;
    })
    .catch((err) => log.error(err))
    .catch(ready);

  return mongoClientPromiseInstance;
}

module.exports = { mongoFactory, mongoClient, mongoDb, mongoClose, mongoClientPromise };
