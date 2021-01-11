const { MongoClient, Logger } = require("mongodb");

let mongoClientInstance = null;

let mongoClientPromiseInstance = null;

let lastConnection = null;

function mongoClientPromise() {
  if (mongoClientPromiseInstance == null) {
    throw new Error(`Mongo not initialized yet. Call mongoFactory() before using mongoClientPromise()`);
  }

  return mongoClientPromiseInstance;
}

function mongoClient() {
  if (mongoClientInstance == null) {
    throw new Error(
      `Mongo not initialized yet. Call and await mongoFactory() before using mongoClient(), mongoDb() or mongoClose()`
    );
  }

  return mongoClientInstance;
}

function mongoDb() {
  return mongoClient().db();
}

function mongoClose() {
  lastConnection = null;
  return mongoClient().close();
}

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
