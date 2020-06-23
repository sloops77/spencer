// eslint-disable-next-line import/no-unresolved
const { MongoClient, Logger } = require("mongodb");
const {
  log,
  env: { nodeEnv, mongoConnection, debug },
} = require("@spencejs/spence-core");

const maxPool = nodeEnv !== "test" ? 10 : 1;

function factory(ready) {
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
  return client
    .connect()
    .then((connectedClient) => ({
      mongoClient: connectedClient,
      db: connectedClient.db(),
    }))
    .catch(ready);
}

module.exports = factory;
