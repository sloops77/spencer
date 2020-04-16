const fastifyFactory = require("fastify");
const _ = require("lodash/fp");
const statusCodes = require("http").STATUS_CODES;
const { initEvents } = require("@spencejs/spence-events");
const { log } = require("@spencejs/spence-core");
const fastifyRest = require("../../src/rest/plugin");
const tablesPreHandler = require("../../src/hooks/tables-pre-handler");

function fastify(routes, defaultHeaders = {}) {
  const app = fastifyFactory({
    logger: log,
    trustProxy: true,
    // @ts-ignore
    caseSensitive: false,
    ignoreTrailingSlash: true,
  });

  initEvents({
    log,
    errorHandler: (event, context, error) => {
      log.error({ context, event }, `Error Context`);
      log.error(error);
    },
  });

  app.setErrorHandler((error, req, reply) => {
    const { res } = reply;

    if (error.validation) {
      res.log.info({ req: reply.request.raw, body: req.body, res, err: error }, error && error.message);
      reply.status(422);
    } else {
      res.log.error({ req: reply.request.raw, body: req.body, res, err: error }, error && error.message);
    }

    if (res.statusCode >= 500) {
      return reply.send(new Error("Something went wrong"));
    }

    return reply.send({
      message: error ? error.message : "",
      errorCode: error.errorCode,
      statusCode: res.statusCode,
      statusText: statusCodes[`${res.statusCode}`],
      data: error.data,
    });
  });

  app.register(fastifyRest);
  app.register(tablesPreHandler);

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
  return app;
}

module.exports = fastify;
