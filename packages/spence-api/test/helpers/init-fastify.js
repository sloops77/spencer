const fastify = require("fastify");
const _ = require("lodash/fp");
const statusCodes = require("http").STATUS_CODES;
const { initEvents } = require("@spencejs/spence-events");
const { log, env } = require("@spencejs/spence-config");
const fastifyRest = require("../../src/rest/plugin");
const { fastifySchemaBuilders } = require("../../src/schema-builders");

async function initFastify(routes, dbPlugin, repoPreHandler, defaultHeaders = {}) {
  const app = fastify({
    loggerInstance: log,
    trustProxy: true,
    routerOptions: {
      caseSensitive: false,
      ignoreTrailingSlash: true,
    },
  });

  app.decorate("config", env);
  app.register(dbPlugin);

  initEvents({
    log,
    errorHandler: (event, context, error) => {
      log.error({ context, event }, `Error Context`);
      log.error(error);
    },
  });

  app.setErrorHandler((error, req, reply) => {
    if (error.validation) {
      req.log.info({ req: reply.request.raw, body: req.body, res: reply.raw, err: error }, error && error.message);
      reply.status(422);
    } else {
      req.log.error({ req: reply.request.raw, body: req.body, res: reply.raw, err: error }, error && error.message);
    }

    if (reply.statusCode >= 500) {
      return reply.send(new Error("Something went wrong"));
    }

    return reply.send({
      message: error ? error.message : "",
      errorCode: error.errorCode,
      statusCode: reply.statusCode,
      statusText: statusCodes[`${reply.statusCode}`],
      data: error.data,
    });
  });

  app.register(fastifySchemaBuilders);
  app.register(fastifyRest);
  app.register(repoPreHandler);

  _.forEach((route) => app.register(routes[route], { prefix: route }), _.keys(routes));

  app.injectJson = async function injectJson({ method, url, userId, payload, headers }) {
    const response = await app.inject({
      method,
      url,
      payload,
      headers: {
        "content-type": "application/json",
        Accept: "application/json",
        "x-user-id": userId || "",
        ...defaultHeaders,
        ...headers,
      },
    });
    if (_.isEmpty(response.body)) {
      return { ...response, json: {} };
    }

    return { ...response, json: JSON.parse(response.body) };
  };

  await app.ready();

  return app;
}

module.exports = initFastify;
