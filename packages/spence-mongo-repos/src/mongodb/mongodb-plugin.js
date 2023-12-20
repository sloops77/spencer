const fastifyPlugin = require("fastify-plugin");
const { mongoFactory, mongoClose } = require("./mongodb-factory");

function mongodbPlugin(fastify, options, next) {
  mongoFactory(
    {
      log: fastify.log,
      config: fastify.config,
    },
    next,
  );

  fastify.addHook("onClose", (instance, closeDone) => {
    mongoClose().then(closeDone);
  });
}

module.exports = fastifyPlugin(mongodbPlugin);
