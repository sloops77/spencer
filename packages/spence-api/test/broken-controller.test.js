const fastifyFactory = require("fastify");
const _ = require("lodash/fp");

const { reposPlugin } = require("@spencejs/spence-pg-repos");
const RestConfigurationError = require("../src/rest/RestConfigurationError");
const { update } = require("../src/rest/rest-handlers");
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

describe("controller plugin errors", () => {
  it("should error if plugin wasnt defined", async () => {
    const app = pluginNotRegisteredFastify({ "/examples": simpleController }, {});
    await expect(app.ready()).rejects.toEqual(
      new RestConfigurationError("To use @spence, please register the fastifyRest plugin with the fastify server"),
    );
  });

  it("should error if update route is defined without an update schema", async () => {
    expect(() =>
      update.schema({
        schemas: { updateSchema: null, replySchema: null },
        schemaBuilders: { updateOne: _.noop },
      }),
    ).toThrow(
      new RestConfigurationError("Must specify an update and reply schema when an update route is specified"),
    );
  });
});
