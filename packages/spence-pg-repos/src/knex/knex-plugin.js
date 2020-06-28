const fastifyPlugin = require("fastify-plugin");
const { knexFactory, knexClose } = require("./knex-factory");

function knexPlugin(fastify, options, next) {
  knexFactory({
    log: fastify.log,
    config: fastify.config,
  });

  fastify.addHook("onClose", (instance, closeDone) => {
    knexClose().then(closeDone);
  });

  next();
}

module.exports = fastifyPlugin(knexPlugin);
