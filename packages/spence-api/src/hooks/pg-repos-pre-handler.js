const fastifyPlugin = require("fastify-plugin");

function pgReposPreHandler(app, options, next) {
  // lazy load of the pg dependency
  // eslint-disable-next-line global-require
  const { bindRepo } = require("@spencejs/spence-pg-repos");

  app.addHook("preHandler", async (req) => {
    req.repos = bindRepo({ tenant: req.tenant, userId: req.userId || (req.user && req.user.id) });
  });

  next();
}

module.exports = fastifyPlugin(pgReposPreHandler);
