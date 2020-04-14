const _ = require("lodash/fp");
const uuidv1 = require("uuid/v1");
const knex = require("../src/knex");
const { createSchema, dropSchema } = require("../src/tables/schemas");
const { tableRegistry, clearTableRegistry, addContext, ready } = require("../src/table-effects/table-registry");
const simpleTableSpec = require("./test-tables");

describe("table registry", () => {
  let schemaName = null;
  let simpleTableEffectsFactory = null;

  afterEach(() => {
    clearTableRegistry();
  });

  beforeAll(async () => {
    schemaName = `simpleTest-${Date.now()}`;
    await createSchema({ schemaName, tableCreators: [simpleTableSpec.simpleTableCreator()] });
    // eslint-disable-next-line prefer-destructuring
    simpleTableEffectsFactory = simpleTableSpec.simpleTableEffectsFactory;
  });

  afterAll(async () => {
    await dropSchema({ schemaName });
    await knex.destroy();
  });

  it("should error if the registry isnt ready yet", async () => {
    const baseTable = simpleTableEffectsFactory({ schemaName });
    expect(tableRegistry.simples).not.toBeNull();
    expect(tableRegistry.simples()).toBe(baseTable());
    const context = { foo: "1" };
    const tableEffects = baseTable(context);
    const val = { id: Date.now().toString(), aVal: "foo" };
    await expect(() => tableEffects.insert(val)).toThrow(new Error("Table not initialized yet. Wait for the ready() signal"));
    await ready();
  })
  it("should register a table and be able to retrieve it", async () => {
    const baseTable = simpleTableEffectsFactory({ schemaName });
    await ready();
    expect(tableRegistry.simples).not.toBeNull();
    expect(tableRegistry.simples()).toBe(baseTable());
  });
  it("should register a table and its extensions and retrieve it", async () => {
    const baseTable = simpleTableEffectsFactory({ schemaName, extensions: [simpleTableSpec.testExtension] });
    await ready();
    const context = { foo: "1" };
    const tableEffects = baseTable(context);
    const registeredTables = addContext(context);
    const val = { id: Date.now().toString(), aVal: "foo" };
    const result = await tableEffects.insert(val);
    expect(result).toEqual({ ...val, createdAt: expect.any(Date) });
    expect(tableEffects.callCounterRef.current).toEqual(1);
    expect(tableEffects.contextRef.current).toBe(context);
    expect(registeredTables.simples).toBe(tableEffects);
  });
  it("should register a table running multiple contextualisations should have no effect", async () => {
    await simpleTableEffectsFactory({ schemaName, extensions: [simpleTableSpec.testExtension] });
    await ready();
    const contexts = [{ foo: "1" }, { foo: "2" }, { foo: "3" }];
    const registeredTablesArray = _.map(addContext, contexts);
    const results = await Promise.all(
      _.map((tables) => tables.simples.insert({ id: uuidv1(), aVal: "foo" }), registeredTablesArray)
    );

    expect(results).toHaveLength(3);

    expect(_.map("simples.callCounterRef.current", registeredTablesArray)).toEqual([1, 1, 1]);
    expect(_.map("simples.contextRef.current", registeredTablesArray)).toEqual(contexts);
    registeredTablesArray[0].simples.insert({ id: uuidv1(), aVal: "foo" });
    expect(_.map("simples.callCounterRef.current", registeredTablesArray)).toEqual([2, 1, 1]);
    expect(_.map("simples.contextRef.current", registeredTablesArray)).toEqual(contexts);
  });
});
