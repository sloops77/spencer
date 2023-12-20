const { MongoClient } = require("mongodb");

let mongoClientInstance = null;

let mongoClientPromiseInstance = null;

let lastConnection = null;
let currentDbName = null;

function mongoClientPromise() {
  if (mongoClientPromiseInstance == null) {
    throw new Error(`Mongo not initialized yet. Call mongoFactory() before using mongoClientPromise()`);
  }

  return mongoClientPromiseInstance;
}

function mongoClient() {
  if (mongoClientInstance == null) {
    throw new Error(
      `Mongo not initialized yet. Call and await mongoFactory() before using mongoClient(), mongoDb() or mongoClose()`,
    );
  }

  return mongoClientInstance;
}

function mongoDb() {
  return mongoClient().db(currentDbName);
}

function mongoClose() {
  lastConnection = null;
  return mongoClient().close();
}

function mongoFactory({ log, config: { nodeEnv, mongoConnection, dbName, debug, mongoOptions = {} } }, ready) {
  if (mongoConnection === lastConnection) {
    throw new Error(
      `Initializing mongo twice to ${mongoConnection} is not possible. Please remove one of the initializations`,
    );
  }
  lastConnection = mongoConnection;
  currentDbName = dbName;

  const maxPool = nodeEnv !== "test" ? 10 : 1;

  // create a client, passing in additional options
  const client = new MongoClient(mongoConnection, {
    maxPoolSize: maxPool,
    monitorCommands: debug === true,
    ...mongoOptions,
  });

  if (debug) {
    client.on("commandStarted", (event) => {
      log.debug({ mongoCommandStarted: event });
    });
    client.on("commandSucceeded", (event) => {
      log.debug({ mongoCommandSucceeded: event });
    });
    client.on("commandFailed", (event) => {
      log.debug({ mongoCommandFailed: event });
    });
  }

  // Use connect method to connect to the server
  mongoClientPromiseInstance = client
    .connect()
    .then((connectedClient) => {
      mongoClientInstance = connectedClient;
      if (ready) ready();
      return mongoClientInstance;
    })
    .catch((err) => log.error(err))
    .catch((err) => {
      if (ready) ready(err);
    });

  return mongoClientPromiseInstance;
}

module.exports = { mongoFactory, mongoClient, mongoDb, mongoClose, mongoClientPromise };
