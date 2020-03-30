const fastifyPlugin = require("fastify-plugin");
const { addContext } = require("../table-effects/table-registry");

function tablesPreHandler(app, options, next) {
  app.addHook("preHandler", async (req) => {
    req.tables = addContext({ tenant: req.tenant, userId: req.userId || (req.user && req.user.id) });
  });

  next();
}

module.exports = fastifyPlugin(tablesPreHandler);
