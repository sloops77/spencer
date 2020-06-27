const fastifyPlugin = require("fastify-plugin");
const { knex, bindRepo } = require("@spencejs/spence-pg-repos");

function pgReposPreHandler(app, options, next) {
  app.addHook("preHandler", async (req) => {
    req.repos = bindRepo({ tenant: req.tenant, userId: req.userId || (req.user && req.user.id) });
  });

  app.addHook("onClose", (instance, done) => {
    knex.destroy().then(done);
  });

  next();
}

module.exports = fastifyPlugin(pgReposPreHandler);
