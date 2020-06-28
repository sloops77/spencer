const _ = require("lodash/fp");
const fastifyPlugin = require("fastify-plugin");

function tenantPreHandler(app, { rootDomain }, next) {
  function parseSubdomain(hostname) {
    const matches = hostname.match(`(.*).${rootDomain}`);
    return _.get("[1]", matches);
  }

  function getTenant(hostname) {
    switch (app.env.nodeEnv) {
      case "test":
        return "test-tenant";
      case "development":
        return "aibo";
      default:
        return parseSubdomain(hostname);
    }
  }

  app.addHook("preHandler", async (req) => {
    const { hostname } = req;
    const tenant = getTenant(hostname);
    req.tenant = tenant;
  });

  next();
}

module.exports = fastifyPlugin(tenantPreHandler);
