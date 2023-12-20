const fp = require("fastify-plugin");
const _ = require("lodash/fp");

function decorateRestRoutes(app) {
  app.decorate("restRoute", _.noop);
  app.decorate(
    "restRoutes",
    function restRoutes(...args) {
      return _.map(this.restRoute, args);
    },
    ["restRoute"],
  );
}

function plugin(fastify, opts, next) {
  decorateRestRoutes(fastify);
  next();
}

module.exports = fp(plugin);
