const fastifyPlugin = require("fastify-plugin");
const { bindRepo } = require("@spencejs/spence-mongo-repos");

function pgReposPreHandler(app, options, next) {
  app.addHook("preHandler", async (req) => {
    req.repos = bindRepo({ tenant: req.tenant, userId: req.userId || (req.user && req.user.id), log: app.log });
  });

  next();
}

module.exports = fastifyPlugin(pgReposPreHandler);
