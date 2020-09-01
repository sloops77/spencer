const fastifyPlugin = require("fastify-plugin");
const { addContext } = require("./repo-registry");

function reposPreHandler(app, options, next) {
  app.decorateRequest("repos", {});
  app.addHook("preHandler", async (req) => {
    // @ts-ignore
    req.repos = addContext(req);
  });

  next();
}

module.exports = fastifyPlugin(reposPreHandler);
