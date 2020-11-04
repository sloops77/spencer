const _ = require("lodash/fp");
const fastifyPlugin = require("fastify-plugin");

function tenantPreHandler(app, { rootDomain }, next) {
  function parseSubdomain(hostname) {
    const matches = hostname.match(`(.*).${rootDomain}`);
    return _.get("[1]", matches);
  }

  function getTenant(hostname) {
    switch (app.config.nodeEnv) {
      case "test":
        return "test-tenant";
      case "development":
        return "dev-tenant";
      default:
        return parseSubdomain(hostname);
    }
  }

  app.addHook("preHandler", async (req) => {
    const { hostname } = req;
    const tenant = getTenant(hostname);
    // @ts-ignore
    req.tenant = tenant;
  });

  next();
}

module.exports = fastifyPlugin(tenantPreHandler);
