const fastifyPlugin = require("fastify-plugin");
const { addContext } = require("./repo-registry");

function reposPreHandler(app, options, next) {
  app.decorateRequest("repos", {});
  app.addHook("preHandler", async (req) => {
    req.repos = addContext({ tenant: req.tenant, userId: req.userId || (req.user && req.user.id) });
  });

  next();
}

module.exports = fastifyPlugin(reposPreHandler);
