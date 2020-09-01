const fs = require("fs");
const path = require("path");
const fp = require("fastify-plugin");
const _ = require("lodash/fp");

/**
 * @param {import("fastify").FastifyInstance<import("http").Server, import("http").IncomingMessage, import("http").ServerResponse>} app
 * @return {void}
 */
function loader(app) {
  const normalizedPath = path.join(__dirname, `schemas`);
  const files = fs.readdirSync(normalizedPath);
  _.flow(
    _.filter(_.endsWith(".json")),
    _.forEach((p) => {
      // eslint-disable-next-line global-require,import/no-dynamic-require
      const schema = require(`./schemas/${p}`);
      app.addSchema(schema);
    })
  )(files);
}

/** @type {(app: import("fastify").FastifyInstance<import("http").Server, import("http").IncomingMessage, import("http").ServerResponse>, options: any, next: (err?: import("fastify").FastifyError) => void) => void} */
function schemaBuildersPlugin(fastify, opts, next) {
  loader(fastify);
  next();
}

module.exports = fp(schemaBuildersPlugin);
