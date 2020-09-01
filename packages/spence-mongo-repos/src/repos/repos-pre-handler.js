const fastifyPlugin = require("fastify-plugin");
const { addContext } = require("./repo-registry");

/**
 * @type {(app: import("fastify").FastifyInstance<import("http").Server, import("http").IncomingMessage, import("http").ServerResponse>, options: any, next: (err?: import("fastify").FastifyError) => void) => void}
 */
function reposPreHandler(app, options, next) {
  app.decorateRequest("repos", {});
  app.addHook("preHandler", async (req) => {
    // @ts-ignore
    req.repos = addContext(req);
  });

  next();
}

module.exports = fastifyPlugin(reposPreHandler);
