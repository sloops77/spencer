const fastifyPlugin = require("fastify-plugin");
const { bindTableEffects } = require("@spencejs/spence-tables");

function tablesPreHandler(app, options, next) {
  app.addHook("preHandler", async (req) => {
    req.tables = bindTableEffects({ tenant: req.tenant, userId: req.userId || (req.user && req.user.id) });
  });

  next();
}

module.exports = fastifyPlugin(tablesPreHandler);
