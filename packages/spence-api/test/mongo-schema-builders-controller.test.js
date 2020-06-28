const _ = require("lodash/fp");
const { ObjectID } = require("mongodb");
const { mongdbPlugin, mongoDb, clearTableRegistry, ready } = require("@spencejs/spence-mongo-repos");
const shortId = require("shortid");
const initFastify = require("./helpers/init-fastify");
const { OBJECT_ID_FORMAT, ISO_DATETIME_FORMAT } = require("./helpers/regexes");
const { newSimpleSchema, simpleSchema } = require("./helpers/pg-rest-controller");
const { schemaBuildingDecorator } = require("../src/schema-builders");
const mongoReposPreHandler = require("../src/hooks/mongo-repos-pre-handler");

function simpleMongoController(fastify, options, next) {
  fastify.get("/:id", { schemas: fastify.schemaBuilders.findOne(simpleSchema) }, async (req) =>
    req.repos.examples.findById(new ObjectID(req.params.id))
  );
  fastify.get("/", { schemas: fastify.schemaBuilders.findMany(simpleSchema) }, async (req) =>
    req.repos.examples.find({})
  );
  fastify.post("/", { schemas: fastify.schemaBuilders.insertOne(newSimpleSchema, simpleSchema) }, async (req) =>
    req.repos.examples.insert(req.body)
  );
  fastify.put("/:id", { schemas: fastify.schemaBuilders.updateOne(newSimpleSchema, simpleSchema) }, async (req) =>
    req.repos.examples.update(new ObjectID(req.params.id), req.body)
  );
  fastify.delete("/:id", { schemas: fastify.schemaBuilders.deleteOne() }, async (req, reply) => {
    await req.repos.examples.del(new ObjectID(req.params.id));
    reply.code(204).send();
  });

  // custom action
  fastify.post(
    "/:id/action",
    {
      schemas: {
        params: fastify.schemaBuilders.idParam,
        response: fastify.schemaBuilders.responses(fastify.schemaBuilders.idParam),
      },
    },
    async (req) => {
      return req.repos.simple.findById(req.params.id);
    }
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
    fastify = await initFastify({ "/examples": decoratedMongoController }, mongdbPlugin, mongoReposPreHandler, {});
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
      ])
    );

    const findResponse = await fastify.injectJson({ method: "GET", url: `/examples` });
    expect(findResponse.json).toEqual(_.sortBy((example) => -new Date(example.createdAt).getTime(), createResponses));
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
    const delResponse = await fastify.injectJson({ method: "DELETE", url: `/examples/${createResponses[0]._id}` });
    expect(delResponse.statusCode).toEqual(204);
    const findResponse = await fastify.injectJson({ method: "GET", url: `/examples` });
    expect(findResponse.json).toEqual([]);
  });
});
