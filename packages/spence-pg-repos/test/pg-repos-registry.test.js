const _ = require("lodash/fp");
const { v1: uuidv1 } = require("uuid");
const { log, env } = require("@spencejs/spence-core");
const { knex, knexFactory } = require("../src/knex");
const { createSchema, dropSchema } = require("../src/tables/schemas");
const { tableRegistry, clearTableRegistry, addContext, ready } = require("../src/repos/repo-registry");
const simpleTableSpec = require("./helpers/test-tables");

describe("pg table registry", () => {
  let schemaName = null;
  let simpleRepoFactory = null;

  afterEach(() => {
    clearTableRegistry();
  });

  beforeAll(async () => {
    schemaName = `simpleTest-${Date.now()}`;
    knexFactory({ log, config: env });
    await createSchema({ schemaName, tableCreators: [simpleTableSpec.simpleTableCreator()] });
    // eslint-disable-next-line prefer-destructuring
    simpleRepoFactory = simpleTableSpec.simpleRepoFactory;
  });

  afterAll(async () => {
    await dropSchema({ schemaName });
    await knex().destroy();
  });

  it("should error if the registry isnt ready yet", async () => {
    const baseTable = simpleRepoFactory({ schemaName });
    expect(tableRegistry.simples).not.toBeNull();
    expect(tableRegistry.simples()).toBe(baseTable());
    const context = { foo: "1" };
    const repo = baseTable(context);
    const val = { id: Date.now().toString(), aVal: "foo" };
    await expect(() => repo.insert(val)).toThrow(new Error("Table not initialized yet. Wait for the ready() signal"));
    await ready();
  });
  it("should register a table and be able to retrieve it", async () => {
    const baseTable = simpleRepoFactory({ schemaName });
    await ready();
    expect(tableRegistry.simples).not.toBeNull();
    expect(tableRegistry.simples()).toBe(baseTable());
  });
  it("should register a table and its extensions and retrieve it", async () => {
    const baseTable = simpleRepoFactory({ schemaName, extensions: [simpleTableSpec.testExtension] });
    await ready();
    const context = { foo: "1" };
    const repo = baseTable(context);
    const registeredTables = addContext(context);
    const val = { id: Date.now().toString(), aVal: "foo" };
    const result = await repo.insert(val);
    expect(result).toEqual({ ...val, createdAt: expect.any(Date) });
    expect(repo.callCounterRef.current).toEqual(1);
    expect(repo.contextRef.current).toBe(context);
    expect(registeredTables.simples).toBe(repo);
  });
  it("should register a table running multiple contextualisations should have no effect", async () => {
    await simpleRepoFactory({ schemaName, extensions: [simpleTableSpec.testExtension] });
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
