const initController = require("../../src/rest/controller");
const { create, getAll, getById, del, update } = require("../../src/rest/rest-handlers");

const simpleProperties = {
  aVal: {
    type: "string",
  },
  manyVals: {
    type: "array",
    items: {
      type: "string",
    },
  },
};

const newSimpleSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "new-simple",
  type: "object",
  properties: simpleProperties,
  required: ["aVal"],
  additionalProperties: false,
};

const putSimpleSchema = { ...newSimpleSchema, $id: "put-simple" };

const patchSimpleSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "patch-simple",
  type: "object",
  properties: simpleProperties,
  minProperties: 1,
  additionalProperties: false,
};

const simpleSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "simple",
  type: "object",
  allOf: [{ $ref: "immutable-entity#" }, { $ref: "new-simple#" }],
  required: ["id", "createdAt", "aVal"],
};

const pgRestController = initController(
  {
    tag: "examples",
    schemas: { create: newSimpleSchema, update: patchSimpleSchema, reply: simpleSchema },
    tableName: "examples",
  },
  (router, controllerOptions, next) => {
    router.restRoutes(create, getAll, getById, update, del);
    next();
  },
);

module.exports = {
  simpleController: pgRestController,
  newSimpleSchema,
  putSimpleSchema,
  patchSimpleSchema,
  simpleSchema,
};
