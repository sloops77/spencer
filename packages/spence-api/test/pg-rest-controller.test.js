const _ = require("lodash/fp");
const {
  createSchema,
  dropSchema,
  knex,
  knexFactory,
  knexClose,
  clearTableRegistry,
  ready,
} = require("@spencejs/spence-pg-repos");
const initFastify = require("./helpers/init-fastify");
const { NUMERIC_FORMAT, ISO_DATETIME_FORMAT } = require("./helpers/regexes");
const { simpleController } = require("./helpers/pg-rest-controller");
const pgReposPreHandler = require("../src/hooks/pg-repos-pre-handler");

describe("rest controller", () => {
  let schemaName = null;
  let fastify = null;

  beforeAll(async () => {
    fastify = initFastify(
      { "/examples": simpleController },
      { factory: knexFactory, close: knexClose },
      pgReposPreHandler,
      {}
    );

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
      ])
    );
    const findResponse = await fastify.injectJson({ method: "GET", url: `/examples` });
    expect(findResponse.json).toEqual([createResponses[1], createResponses[0]]);
  });

  it("update simples", async () => {
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
      ])
    );
    const updateResponse = await fastify.injectJson({
      method: "PATCH",
      url: `/examples/${createResponses[0].id}`,
      payload: { aVal: "not-test" },
    });
    expect(updateResponse.json).toEqual({ ...createResponses[0], aVal: "not-test" });
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
      ])
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
