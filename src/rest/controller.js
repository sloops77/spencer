const _ = require("lodash/fp");
const RestConfigurationError = require("./RestConfigurationError");
const configureSchemaBuilders = require("./schema-builders");

const supportedRoutes = ["create", "get", "update", "delete", "all"];

function initAddRoute(
  router,
  { createSchema, updateSchema, replySchema },
  tableEffects,
  { insertOne, updateOne, deleteOne, findOne, findMany }
) {
  return function addRoute(routeName) {
    // eslint-disable-next-line default-case
    switch (routeName) {
      case "create": {
        router.post("/", { schema: insertOne(createSchema, replySchema) }, async (req, reply) => {
          const result = await tableEffects(req).insert(req.body);
          reply.code(201).send(result);
        });
        return;
      }
      case "get": {
        router.get("/:id", { schema: findOne(replySchema) }, async (req, reply) => {
          reply.send(await tableEffects(req).findById(req.params.id));
        });
        return;
      }
      case "all": {
        router.get("/", { schema: findMany(replySchema) }, async (req, reply) => {
          const results = await tableEffects(req).find(req.query);
          reply.send(results);
        });
        return;
      }
      case "update": {
        router.patch("/:id", { schema: updateOne(updateSchema, replySchema) }, async (req, reply) => {
          const result = await tableEffects(req).update(req.params.id, req.body);
          reply.send(result);
        });
        return;
      }
      case "delete": {
        router.delete("/:id", { schema: deleteOne() }, async (req, reply) => {
          await tableEffects(req).del(req.params.id, req.body);
          reply.code(204).send(router);
        });
      }
    }
  };
}

function init(
  {
    tag,
    routes = [],
    schemas: { create: createSchema, update: updateSchema, reply: replySchema },
    tableEffects: tableEffectsParam,
    tableName
  },
  extend
) {
  const normalizedRoutes = _.map(_.toLower, routes);
  /**
   * @param {{ slack: any }} options
   * @returns {addRoutesFn}
   */
  // eslint-disable-next-line complexity
  return function addRoutes(router, opts, next) {
    if (normalizedRoutes.includes("create") && createSchema == null) {
      throw new RestConfigurationError(`Must specify a create schema when a create route is specified`);
    }

    if (normalizedRoutes.includes("update") && updateSchema == null) {
      throw new RestConfigurationError(`Must specify a update schema when an update route is specified`);
    }

    if (extend != null && !_.isFunction(extend)) {
      throw new RestConfigurationError(`extend must be a function that takes three arguments router, opts, and next`);
    }

    const unrecognizedRoutes = _.without(supportedRoutes, normalizedRoutes);
    if (_.size(unrecognizedRoutes)) {
      throw new RestConfigurationError(
        `Unrecognized routes ${unrecognizedRoutes.join(",")}. Only routes ${supportedRoutes.join(
          ","
        )} are supported. Use the final argument, 'extend' to add more routes`
      );
    }

    const schemaBuilders = configureSchemaBuilders(tag);

    function tableEffects(req) {
      return tableEffectsParam || req.tables[tableName];
    }

    const addRoute = initAddRoute(
      router,
      { createSchema, updateSchema, replySchema },
      tableEffects || tableName,
      schemaBuilders
    );
    const schemas = _.uniqBy("$id", _.compact([createSchema, updateSchema, replySchema]));
    _.forEach(s => router.addSchema(s), schemas);
    _.forEach(addRoute, normalizedRoutes);
    if (extend != null) {
      extend(router, _.assign(opts, { tableEffects, schemaBuilders }), next);
      return;
    }

    next();
  };
}

module.exports = init;
