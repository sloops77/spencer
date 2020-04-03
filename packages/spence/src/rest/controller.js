const _ = require("lodash/fp");
const RestConfigurationError = require("./RestConfigurationError");
const configureSchemaBuilders = require("./schema-builders");

function instantiateRoute(routeSpec, options) {
  return {
    ...routeSpec,
    schema: routeSpec.schema(options),
    handler: routeSpec.handler(options),
  };
}

function init(
  {
    tag,
    schemas: { create: createSchema, update: updateSchema, reply: replySchema },
    tableEffects: tableEffectsParam,
    tableName,
  },
  extend
) {
  /**
   * @param {{ slack: any }} options
   * @returns {addRoutesFn}
   */
  return function addRoutes(router, opts, next) {
    if (extend == null && !_.isFunction(extend)) {
      next(
        new RestConfigurationError(`last argument must be a function that takes three arguments router, opts, and next`)
      );
      return;
    }

    if (router.restRoutes == null) {
      next(
        new RestConfigurationError(`To use @spence, please register the fastifyRest plugin with the fastify server`)
      );
      return;
    }

    const schemas = _.uniqBy("$id", _.compact([createSchema, updateSchema, replySchema]));
    _.forEach((s) => router.addSchema(s), schemas);

    const spenceControllerOptions = _.assign(opts, {
      tableEffects(req) {
        return tableEffectsParam || req.tables[tableName];
      },
      schemas: { createSchema, updateSchema, replySchema },
      schemaBuilders: configureSchemaBuilders(tag),
    });
    // eslint-disable-next-line no-param-reassign
    router.restRoute = function restRoute(handlerSpec) {
      router.route(instantiateRoute(handlerSpec, spenceControllerOptions));
    };

    if (extend != null) {
      extend(router, spenceControllerOptions, next);
      return;
    }

    next();
  };
}

module.exports = init;
