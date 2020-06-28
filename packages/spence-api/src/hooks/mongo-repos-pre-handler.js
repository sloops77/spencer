const fastifyPlugin = require("fastify-plugin");

function mongoReposPreHandler(app, options, next) {
  // lazy load of the mongo dependency
  // eslint-disable-next-line global-require
  const { bindRepo } = require("@spencejs/spence-mongo-repos");

  app.addHook("preHandler", async (req) => {
    req.repos = bindRepo({ tenant: req.tenant, userId: req.userId || (req.user && req.user.id), log: app.log });
  });

  next();
}

module.exports = fastifyPlugin(mongoReposPreHandler);
