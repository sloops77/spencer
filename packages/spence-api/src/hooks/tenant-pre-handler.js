const _ = require("lodash/fp");
const fastifyPlugin = require("fastify-plugin");

/**
 * @type {(app: import("fastify").FastifyInstance<import("http").Server, import("http").IncomingMessage, import("http").ServerResponse> & {env: any}, options: any, next: (err?: import("fastify").FastifyError) => void) => void}
 */
function tenantPreHandler(app, { rootDomain }, next) {
  /**
   * @param {string} hostname
   * @return {string}
   */
  function parseSubdomain(hostname) {
    const matches = hostname.match(`(.*).${rootDomain}`);
    return _.get("[1]", matches);
  }

  /**
   * @param {string} hostname
   * @return {string}
   */
  function getTenant(hostname) {
    switch (app.env.nodeEnv) {
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

// @ts-ignore
module.exports = fastifyPlugin(tenantPreHandler);
