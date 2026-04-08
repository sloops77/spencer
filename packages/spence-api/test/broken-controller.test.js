const fastifyFactory = require("fastify");
const _ = require("lodash/fp");

const { reposPlugin } = require("@spencejs/spence-pg-repos");
const RestConfigurationError = require("../src/rest/RestConfigurationError");
const initController = require("../src/rest/controller");
const fastifyRest = require("../src/rest/plugin");
const { create, getById, getAll, update } = require("../src/rest/rest-handlers");
const { simpleController } = require("./helpers/pg-rest-controller");

function pluginNotRegisteredFastify(routes) {
  const app = fastifyFactory();

  app.register(reposPlugin);

  _.forEach(
    (route) => app.register(routes[route], { prefix: route }), // .after((err) => err != null && console.error(err)),
    _.keys(routes),
  );
  return app;
}

function buildBrokenController(route, schemas) {
  return initController(
    {
      tag: "examples",
      schemas,
      tableName: "examples",
    },
    (router, controllerOptions, next) => {
      router.restRoutes(route);
      next();
    },
  );
}

function brokenControllerFastify(route, schemas) {
  const app = fastifyFactory();

  app.register(fastifyRest);
  app.register(buildBrokenController(route, schemas), { prefix: "/examples" });

  return app;
}

describe("controller plugin errors", () => {
  it("should error if plugin wasnt defined", async () => {
    const app = pluginNotRegisteredFastify({ "/examples": simpleController }, {});
    await expect(app.ready()).rejects.toEqual(
      new RestConfigurationError("To use @spence, please register the fastifyRest plugin with the fastify server"),
    );
  });

  it("should error if create route is defined without a create schema", async () => {
    const app = brokenControllerFastify(create, { create: null, update: null, reply: null });

    await expect(app.ready()).rejects.toEqual(
      new RestConfigurationError("Must specify a create and reply schema when a create route is specified"),
    );
  });

  it("should error if getById route is defined without a reply schema", async () => {
    const app = brokenControllerFastify(getById, { create: null, update: null, reply: null });

    await expect(app.ready()).rejects.toEqual(
      new RestConfigurationError("Must specify a reply schema when a getById route is specified"),
    );
  });

  it("should error if getAll route is defined without a reply schema", async () => {
    const app = brokenControllerFastify(getAll, { create: null, update: null, reply: null });

    await expect(app.ready()).rejects.toEqual(
      new RestConfigurationError("Must specify a reply schema when a getAll route is specified"),
    );
  });

  it("should error if update route is defined without an update schema", async () => {
    const app = brokenControllerFastify(update, { create: null, update: null, reply: null });

    await expect(app.ready()).rejects.toEqual(
      new RestConfigurationError("Must specify an update and reply schema when an update route is specified"),
    );
  });
});
