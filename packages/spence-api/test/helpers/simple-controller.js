const initController = require("../../src/rest/controller");
const { create, getAll, getById, del, update } = require("../../src/rest/rest-handlers");

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

const simpleController = initController(
  {
    tag: "examples",
    schemas: { create: newSimpleSchema, reply: simpleSchema },
    tableName: "examples",
  },
  (router, controllerOptions, next) => {
    router.restRoutes(create, getAll, getById, update, del);
    next();
  }
);

module.exports = {
  simpleController,
  newSimpleSchema,
  simpleSchema,
};