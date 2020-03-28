const fs = require("fs");
const path = require("path");
const fp = require("fastify-plugin");
const _ = require("lodash/fp");

function loader(app) {
  const normalizedPath = path.join(__dirname, `schemas`);
  const files = fs.readdirSync(normalizedPath);
  return _.flow(
    _.filter(_.endsWith(".json")),
    _.forEach((p) => {
      // eslint-disable-next-line global-require,import/no-dynamic-require
      const schema = require(`./schemas/${p}`);
      app.addSchema(schema);
    })
  )(files);
}

function plugin(fastify, opts, next) {
  loader(fastify);
  next();
}

module.exports = fp(plugin);
