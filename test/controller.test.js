const initController = require("../src/rest/controller");
const { createSchema, dropSchema } = require("../src/tables/db");
const knex = require("../src/tables/index");
const { clearTableRegistry } = require("../src/table-effects/table-registry");
const initFastify = require("./helpers/fastify");
const { NUMERIC_FORMAT, ISO_DATETIME_FORMAT } = require("./helpers/regexes");

const newSimpleSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "new-simple",
  type: "object",
  properties: {
    aVal: {
      type: "string",
    },
    manyVals: {
      type: "array",
      items: {
        type: "string",
      },
      defaults: [],
    },
  },
  required: ["aVal"],
  additionalProperties: false,
};

const simpleSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "simple",
  type: "object",
  allOf: ["immutable-entity#", "new-simple#"],
  required: ["id", "createdAt", "aVal"],
};

describe("controller", () => {
  let schemaName = null;
  let simpleController = null;
  let fastify = null;

  beforeAll(async () => {
    // eslint-disable-next-line global-require
    const { exampleTableCreator, examplesTableEffectsFactory } = require("./simple-table");

    schemaName = `simpleTest--${Date.now()}`;
    await createSchema({
      schemaName,
      tableCreators: [exampleTableCreator(false)],
    });
    (await examplesTableEffectsFactory({ schemaName, transformCase: false }))();

    simpleController = initController({
      tag: "",
      routes: ["create", "get", "all"],
      schemas: { create: newSimpleSchema, reply: simpleSchema },
      tableName: "examples",
    });

    fastify = initFastify({ "/examples": simpleController }, {});
  });

  beforeEach(async () => {});

  afterAll(async () => {
    await fastify.close();
    clearTableRegistry();
    await dropSchema({ schemaName });
    knex.destroy();
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
});
