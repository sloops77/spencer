const _ = require("lodash/fp");
const { ObjectId } = require("mongodb");
const { mongodbPlugin, reposPlugin, mongoDb, clearTableRegistry, ready } = require("@spencejs/spence-mongo-repos");
const shortId = require("shortid");
const initFastify = require("./helpers/init-fastify");
const { OBJECT_ID_FORMAT, ISO_DATETIME_FORMAT } = require("./helpers/regexes");
const { newSimpleSchema, putSimpleSchema, patchSimpleSchema } = require("./helpers/pg-rest-controller");
const { schemaBuildingDecorator } = require("../src/schema-builders");

const simpleSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "mongo-simple",
  type: "object",
  properties: {
    _id: {
      type: "string",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
    aVal: {
      type: "string",
    },
    manyVals: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: ["_id", "createdAt", "updatedAt", "aVal"],
};

function simpleMongoController(fastify, options, next) {
  fastify.addSchema(newSimpleSchema);
  fastify.addSchema(simpleSchema);

  fastify.get("/:id", { schema: fastify.schemaBuilders.findOne(simpleSchema) }, async (req) =>
    req.repos.examples.findById(new ObjectId(req.params.id)),
  );
  fastify.get("/", { schema: fastify.schemaBuilders.findMany(simpleSchema) }, async (req) =>
    req.repos.examples.find(req.query),
  );
  fastify.post("/", { schema: fastify.schemaBuilders.insertOne(newSimpleSchema, simpleSchema) }, async (req) =>
    req.repos.examples.insert(req.body),
  );
  fastify.put("/:id", { schema: fastify.schemaBuilders.updateOne(putSimpleSchema, simpleSchema) }, async (req) =>
    req.repos.examples.update(new ObjectId(req.params.id), req.body),
  );
  fastify.patch("/:id", { schema: fastify.schemaBuilders.updateOne(patchSimpleSchema, simpleSchema) }, async (req) =>
    req.repos.examples.update(new ObjectId(req.params.id), req.body),
  );
  fastify.delete("/:id", { schema: fastify.schemaBuilders.deleteOne() }, async (req, reply) => {
    await req.repos.examples.del(new ObjectId(req.params.id));
    reply.code(204).send();
  });

  // custom action
  fastify.post(
    "/:id/action",
    {
      schema: {
        params: fastify.schemaBuilders.idParam,
        response: fastify.schemaBuilders.responses({ 200: fastify.schemaBuilders.idParam }),
      },
    },
    async (req) => req.repos.simple.findById(req.params.id),
  );

  next();
}

const decoratedMongoController = schemaBuildingDecorator(simpleMongoController);

describe("schemaBuilder decorated controller", () => {
  let fastify = null;
  const schemaName = shortId.generate();

  beforeEach(async () => {
    await mongoDb().collection(`${schemaName}.examples`).deleteMany({});
  });

  beforeAll(async () => {
    fastify = await initFastify({ "/examples": decoratedMongoController }, mongodbPlugin, reposPlugin, {});
    const {
      examplesRepoFactory,
      // eslint-disable-next-line global-require
    } = require("../../spence-mongo-repos/test/helpers/test-tables");

    examplesRepoFactory({ schemaName })();
    await ready();
  });

  afterAll(async () => {
    clearTableRegistry();
    await mongoDb().dropCollection(`${schemaName}.examples`);
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
      _id: expect.stringMatching(OBJECT_ID_FORMAT),
      createdAt: expect.stringMatching(ISO_DATETIME_FORMAT),
      updatedAt: expect.stringMatching(ISO_DATETIME_FORMAT),
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
      url: `/examples/${createResponse.json._id}`,
    });

    expect(findResponse.json).toEqual({
      _id: expect.stringMatching(OBJECT_ID_FORMAT),
      createdAt: expect.stringMatching(ISO_DATETIME_FORMAT),
      updatedAt: expect.stringMatching(ISO_DATETIME_FORMAT),
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
    expect(findResponse.json).toEqual(_.sortBy((example) => -new Date(example.createdAt).getTime(), createResponses));
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

    const sortedResponses = _.sortBy((example) => -new Date(example.createdAt).getTime(), createResponses);
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
      ]),
    );
    const updateResponse = await fastify.injectJson({
      method: "PUT",
      url: `/examples/${createResponses[0]._id}`,
      payload: { aVal: "not-test" },
    });
    expect(updateResponse.json).toEqual({
      ...createResponses[0],
      aVal: "not-test",
      updatedAt: expect.stringMatching(ISO_DATETIME_FORMAT),
    });
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
      url: `/examples/${createResponses[0]._id}`,
      payload: { aVal: "not-test" },
    });
    expect(updateResponse.json).toEqual({
      ...createResponses[0],
      aVal: "not-test",
      updatedAt: expect.stringMatching(ISO_DATETIME_FORMAT),
    });
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
      url: `/examples/${createResponse.json._id}`,
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
    const delResponse = await fastify.injectJson({ method: "DELETE", url: `/examples/${createResponses[0]._id}` });
    expect(delResponse.statusCode).toEqual(204);
    const findResponse = await fastify.injectJson({ method: "GET", url: `/examples` });
    expect(findResponse.json).toEqual([]);
  });
});
