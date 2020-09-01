const fastifyPlugin = require("fastify-plugin");
const { mongoFactory, mongoClose } = require("./mongodb-factory");

/** @type {(instance: import("fastify").FastifyInstance<import("http").Server, import("http").IncomingMessage, import("http").ServerResponse> & {config: object}, options: any, callback: (err?: import("fastify").FastifyError) => void) => void} */
function mongodbPlugin(fastify, options, next) {
  mongoFactory(
    {
      log: fastify.log,
      config: fastify.config,
    },
    next
  );

  fastify.addHook("onClose", (instance, closeDone) => {
    mongoClose().then(closeDone);
  });
}

module.exports = fastifyPlugin(mongodbPlugin);
