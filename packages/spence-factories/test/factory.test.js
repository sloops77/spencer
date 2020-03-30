const { register } = require("../src/factory");
const knex = require("../../spence/src/tables");
const { createSchema, dropSchema } = require("../../spence/src/tables/db");
const { clearTableRegistry } = require("../../spence/src/table-effects/table-registry");

describe("test factories", () => {
  let simpleTable = null;
  let schemaName = null;

  beforeAll(async () => {
    schemaName = `simpleTest-${Date.now()}`;
    const { simpleTableCreator, simpleTableEffectsFactory } = require("../../spence/test/simple-table"); // eslint-disable-line global-require
    await createSchema({
      schemaName,
      tableCreators: [simpleTableCreator(false)],
    });
    simpleTable = (await simpleTableEffectsFactory({ schemaName, transformCase: false }))();
  });

  afterAll(async () => {
    clearTableRegistry();
    await dropSchema({ schemaName });
    knex.destroy();
  });

  it("should create a new struct without an id", () => {
    register("simple", simpleTable, () => {});
  });
  it("should create a new struct with an id", () => {});
  it("should create a new persisted struct", () => {});
});
