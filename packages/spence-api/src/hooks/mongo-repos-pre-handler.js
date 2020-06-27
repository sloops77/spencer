const fastifyPlugin = require("fastify-plugin");
const { bindRepo, getMongoClient } = require("@spencejs/spence-mongo-repos");
const { log } = require("@spencejs/spence-core");

function pgReposPreHandler(app, options, next) {
  app.addHook("preHandler", async (req) => {
    req.repos = bindRepo({ tenant: req.tenant, userId: req.userId || (req.user && req.user.id), log });
  });

  app.addHook("onClose", (instance, done) => {
    getMongoClient().close().then(done);
  });

  next();
}

module.exports = fastifyPlugin(pgReposPreHandler);
