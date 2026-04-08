const _ = require("lodash/fp");
const {
  createSchema,
  dropSchema,
  knex,
  knexPlugin,
  clearTableRegistry,
  ready,
  reposPlugin,
} = require("@spencejs/spence-pg-repos");
const initFastify = require("./helpers/init-fastify");
const { NUMERIC_FORMAT, ISO_DATETIME_FORMAT } = require("./helpers/regexes");
const { simpleController } = require("./helpers/pg-rest-controller");

function sortExamples(examples) {
  return _.orderBy(["createdAt", "id"], ["desc", "asc"], examples);
}

describe("rest controller", () => {
  let schemaName = null;
  let fastify = null;

  beforeAll(async () => {
    fastify = await initFastify({ "/examples": simpleController }, knexPlugin, reposPlugin, {});

    const {
      exampleTableCreator,
      examplesRepoFactory,
      // eslint-disable-next-line global-require
    } = require("../../spence-pg-repos/test/helpers/test-tables");

    schemaName = `simpleTest--${Date.now()}`;
    await createSchema({
      schemaName,
      tableCreators: [exampleTableCreator(false)],
    });
    examplesRepoFactory({ schemaName, transformCase: false })();
    await ready();
  });

  beforeEach(async () => {
    await knex(`${schemaName}.examples`).truncate();
  });

  afterAll(async () => {
    clearTableRegistry();
    await dropSchema({ schemaName });
    await fastify.close();
  });

  it("create simples", async () => {
    const response = await fastify.injectJson({
      method: "POST",
      url: "/examples",
      payload: {
        aVal: "test",
      },
    });
    expect(response.json).toEqual({
      id: expect.stringMatching(NUMERIC_FORMAT),
      createdAt: expect.stringMatching(ISO_DATETIME_FORMAT),
      aVal: "test",
    });
  });

  it("rejects invalid create payloads", async () => {
    const response = await fastify.injectJson({
      method: "POST",
      url: "/examples",
      payload: {},
    });

    expect(response.statusCode).toEqual(422);
    expect(response.json).toEqual(
      expect.objectContaining({
        statusCode: 422,
        statusText: "Unprocessable Entity",
      }),
    );
  });

  it("find simples", async () => {
    const createResponse = await fastify.injectJson({
      method: "POST",
      url: "/examples",
      payload: {
        aVal: "test",
      },
    });

    const findResponse = await fastify.injectJson({
      method: "GET",
      url: `/examples/${createResponse.json.id}`,
    });

    expect(findResponse.json).toEqual({
      id: expect.stringMatching(NUMERIC_FORMAT),
      createdAt: expect.stringMatching(ISO_DATETIME_FORMAT),
      aVal: "test",
    });
  });

  it("find all simples", async () => {
    const createResponses = _.map(
      "json",
      await Promise.all([
        fastify.injectJson({
          method: "POST",
          url: "/examples",
          payload: {
            aVal: "test",
          },
        }),
        fastify.injectJson({
          method: "POST",
          url: "/examples",
          payload: {
            aVal: "toast",
          },
        }),
      ]),
    );
    const findResponse = await fastify.injectJson({ method: "GET", url: `/examples` });
    expect(findResponse.json).toEqual(sortExamples(createResponses));
  });

  it("find all simples with limit and offset", async () => {
    const createResponses = _.map(
      "json",
      await Promise.all([
        fastify.injectJson({
          method: "POST",
          url: "/examples",
          payload: {
            aVal: "test",
          },
        }),
        fastify.injectJson({
          method: "POST",
          url: "/examples",
          payload: {
            aVal: "toast",
          },
        }),
      ]),
    );

    const sortedResponses = sortExamples(createResponses);
    const findResponse = await fastify.injectJson({ method: "GET", url: `/examples?limit=1&offset=1` });
    expect(findResponse.json).toEqual([sortedResponses[1]]);
  });

  it("rejects non-integer limit and offset", async () => {
    const response = await fastify.injectJson({
      method: "GET",
      url: `/examples?limit=1.5&offset=-1`,
    });

    expect(response.statusCode).toEqual(422);
    expect(response.json).toEqual(
      expect.objectContaining({
        statusCode: 422,
        statusText: "Unprocessable Entity",
      }),
    );
  });

  it("patch simples", async () => {
    const createResponses = _.map(
      "json",
      await Promise.all([
        fastify.injectJson({
          method: "POST",
          url: "/examples",
          payload: {
            aVal: "test",
          },
        }),
      ]),
    );
    const updateResponse = await fastify.injectJson({
      method: "PATCH",
      url: `/examples/${createResponses[0].id}`,
      payload: { aVal: "not-test" },
    });
    expect(updateResponse.json).toEqual({ ...createResponses[0], aVal: "not-test" });
  });

  it("rejects invalid patch payloads", async () => {
    const createResponse = await fastify.injectJson({
      method: "POST",
      url: "/examples",
      payload: {
        aVal: "test",
      },
    });

    const response = await fastify.injectJson({
      method: "PATCH",
      url: `/examples/${createResponse.json.id}`,
      payload: {},
    });

    expect(response.statusCode).toEqual(422);
    expect(response.json).toEqual(
      expect.objectContaining({
        statusCode: 422,
        statusText: "Unprocessable Entity",
      }),
    );
  });

  it("del simples", async () => {
    const createResponses = _.map(
      "json",
      await Promise.all([
        fastify.injectJson({
          method: "POST",
          url: "/examples",
          payload: {
            aVal: "test",
          },
        }),
      ]),
    );
    const delResponse = await fastify.injectJson({ method: "DELETE", url: `/examples/${createResponses[0].id}` });
    expect(delResponse.statusCode).toEqual(204);
    const findResponse = await fastify.injectJson({ method: "GET", url: `/examples` });
    expect(findResponse.json).toEqual([]);
  });

  describe("extensions", () => {
    it("should be possible to add an extension and it works", () => {});
    it("should be possible to add an extension that sets a transaction", () => {});
  });
});
