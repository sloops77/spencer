const fastifyPlugin = require("fastify-plugin");
const { bindRepo } = require("@spencejs/spence-pg-repos");

function reposPreHandler(app, options, next) {
  app.addHook("preHandler", async (req) => {
    req.repos = bindRepo({ tenant: req.tenant, userId: req.userId || (req.user && req.user.id) });
  });

  next();
}

module.exports = fastifyPlugin(reposPreHandler);
