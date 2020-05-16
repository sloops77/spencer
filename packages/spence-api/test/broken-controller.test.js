const fastifyFactory = require("fastify");
const _ = require("lodash/fp");

const reposPreHandler = require("../src/hooks/repos-pre-handler");

const RestConfigurationError = require("../src/rest/RestConfigurationError");
const { simpleController } = require("./helpers/simple-controller");

function pluginNotRegisteredFastify(routes) {
  const app = fastifyFactory();

  app.register(reposPreHandler);

  _.forEach(
    (route) => app.register(routes[route], { prefix: route }), // .after((err) => err != null && console.error(err)),
    _.keys(routes)
  );
  return app;
}

describe("controller plugin errors", () => {
  it("should error if plugin wasnt defined", async () => {
    const app = pluginNotRegisteredFastify({ "/examples": simpleController }, {});
    await expect(app.ready()).rejects.toEqual(
      new RestConfigurationError("To use @spence, please register the fastifyRest plugin with the fastify server")
    );
  });
});
