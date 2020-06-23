const _ = require("lodash/fp");
const { v1: uuidv1 } = require("uuid");
const shortid = require("shortid");
const { ObjectID } = require("mongodb");
const mongoClientPromise = require("../src/mongodb");
const { tableRegistry, clearTableRegistry, addContext, ready } = require("../src/repos/repo-registry");
const simpleTableSpec = require("./helpers/test-tables");

describe("collection registry", () => {
  let schemaName = null;
  let simpleRepoFactory = null;

  afterEach(() => {
    clearTableRegistry();
  });

  beforeAll(async () => {
    schemaName = shortid.generate();
    // await createDb({ dbName });
    // await createSchema({ dbName, tableCreators: [simpleTableSpec.simpleTableCreator()] });
    // eslint-disable-next-line prefer-destructuring
    simpleRepoFactory = simpleTableSpec.simpleRepoFactory;
  });

  afterAll(async () => {
    const { mongoClient } = await mongoClientPromise;
    await mongoClient.close();
  });

  it("should error if the registry isn't ready yet", async () => {
    const baseCollection = simpleRepoFactory({ schemaName });
    expect(tableRegistry.simples).not.toBeNull();
    expect(tableRegistry.simples()).toBe(baseCollection());
    const context = { foo: "1" };
    const repo = baseCollection(context);
    const val = { aVal: "foo" };
    await expect(() => repo.insert(val)).toThrow(new Error("Mongodb not initialized yet. Wait for the ready() signal"));
    await ready();
  });
  it("should register a collection and be able to retrieve it", async () => {
    const baseCollection = simpleRepoFactory({ schemaName });
    await ready();
    expect(tableRegistry.simples).not.toBeNull();
    expect(tableRegistry.simples()).toBe(baseCollection());
  });
  it("should register a collection and its extensions and retrieve it", async () => {
    const baseCollection = simpleRepoFactory({ schemaName, extensions: [simpleTableSpec.testExtension] });
    await ready();
    const context = { foo: "1" };
    const repo = baseCollection(context);
    const registeredTables = addContext(context);
    const val = { aVal: "foo" };
    const result = await repo.insert(val);
    expect(result).toEqual({
      ...val,
      _id: expect.any(ObjectID),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(repo.callCounterRef.current).toEqual(1);
    expect(repo.contextRef.current).toBe(context);
    expect(registeredTables.simples).toBe(repo);
  });
  it("should register a collection running multiple contextualisations should have no effect", async () => {
    await simpleRepoFactory({ schemaName, extensions: [simpleTableSpec.testExtension] });
    await ready();
    const contexts = [{ foo: "1" }, { foo: "2" }, { foo: "3" }];
    const registeredTablesArray = _.map(addContext, contexts);
    const results = await Promise.all(
      _.map((tables) => tables.simples.insert({ aVal: "foo" }), registeredTablesArray)
    );

    expect(results).toHaveLength(3);

    expect(_.map("simples.callCounterRef.current", registeredTablesArray)).toEqual([1, 1, 1]);
    expect(_.map("simples.contextRef.current", registeredTablesArray)).toEqual(contexts);
    registeredTablesArray[0].simples.insert({ aVal: "foo" });
    expect(_.map("simples.callCounterRef.current", registeredTablesArray)).toEqual([2, 1, 1]);
    expect(_.map("simples.contextRef.current", registeredTablesArray)).toEqual(contexts);
  });
});
