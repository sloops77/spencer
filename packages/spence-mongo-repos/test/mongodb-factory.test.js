const shortid = require("shortid");
const { env } = require("@spencejs/spence-config");
const { ObjectId } = require("mongodb");
const { mongoFactory, mongoDb, mongoClose } = require("../src/mongodb");
const { simpleRepoFactory } = require("./helpers/test-tables");
const { ready, clearTableRegistry } = require("../src/repos/repo-registry");

describe("mongo factory", () => {
  const schemaName = shortid.generate();
  let mockLog;

  beforeAll(() => {
    mockLog = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  });

  beforeEach(() => jest.resetAllMocks());

  afterEach(async () => {
    clearTableRegistry();
    // delete schema tables?
    await mongoDb().dropCollection(`${schemaName}.simples`);
    await mongoClose();
  });

  it("should create a connection and insert", async () => {
    await mongoFactory({ log: mockLog, config: env });
    const simpleTable = simpleRepoFactory({ schemaName });
    await ready();

    const val = { aVal: "foo" };
    const result = await simpleTable({}).insert(val);
    expect(result).toEqual({
      _id: expect.any(ObjectId),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      ...val,
    });
    expect(mockLog.debug).toHaveBeenCalledTimes(0);
  });

  it("should support debugging", async () => {
    await mongoFactory({ log: mockLog, config: { ...env, debug: true } });
    const simpleTable = simpleRepoFactory({ schemaName });
    await ready();

    const val = { aVal: "foo" };
    const result = await simpleTable({}).insert(val);
    expect(result).toEqual({
      _id: expect.any(ObjectId),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      ...val,
    });

    expect(mockLog.debug).toHaveBeenCalledTimes(2);
    expect(mockLog.debug.mock.calls).toEqual([
      [{ mongoCommandStarted: expect.objectContaining({ commandName: "insert" }) }],
      [{ mongoCommandSucceeded: expect.objectContaining({ commandName: "insert" }) }],
    ]);
  });

  it("should be able to set any mongoOption", async () => {
    const client = await mongoFactory({ config: { ...env, mongoOptions: { monitorCommands: true } } });
    client.on("commandStarted", (event) => {
      mockLog.info({ mongoCommandStarted: event });
    });

    const simpleTable = simpleRepoFactory({ schemaName });
    await ready();

    const val = { aVal: "foo" };
    const result = await simpleTable({}).insert(val);
    expect(result).toEqual({
      _id: expect.any(ObjectId),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      ...val,
    });

    expect(mockLog.debug).toHaveBeenCalledTimes(0);
    expect(mockLog.info).toHaveBeenCalledTimes(1);
    expect(mockLog.info.mock.calls).toEqual([
      [{ mongoCommandStarted: expect.objectContaining({ commandName: "insert" }) }],
    ]);
  });
});
