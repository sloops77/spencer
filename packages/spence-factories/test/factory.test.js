const _ = require("lodash/fp");
const uuidv1 = require("uuid/v1");
const { ObjectID } = require("mongodb");
const { knex, clearTableRegistry, ready, createSchema, dropSchema } = require("@spencejs/spence-pg-repos");
const {
  getMongoClient,
  clearTableRegistry: clearMongoCollectionRegistry,
  ready: mongoReady,
} = require("@spencejs/spence-mongo-repos");
const { simpleRepoFactory } = require("../../spence-mongo-repos/test/helpers/test-tables");
const { register } = require("../src/factory");
const {
  simpleUuidTableCreator,
  simpleUuidRepoFactory,
  complexTableCreator,
  complexRepoFactory,
} = require("../../spence-pg-repos/test/helpers/test-tables");
const { UUID_FORMAT, ISO_DATETIME_FORMAT, OBJECT_ID_FORMAT } = require("../../spence-api/test/helpers/regexes");

describe("test mongo factories", () => {
  let simpleCollection = null;
  let schemaName = null;

  beforeAll(async () => {
    schemaName = `simpleTest-${Date.now()}`;
    simpleCollection = simpleRepoFactory({ schemaName })();
    await mongoReady();
  });

  afterAll(async () => {
    clearMongoCollectionRegistry();
    return getMongoClient().close();
  });

  let simpleFactory;
  beforeEach(async () => {
    simpleFactory = register("simple", simpleCollection, (overrides) => ({
      aVal: "test",
      ...overrides(),
    }));
    return simpleCollection.collection().deleteMany({});
  });

  it("should create a new struct without an id", () => {
    const { newSimple } = simpleFactory;
    expect(newSimple()).toEqual({ aVal: "test" });
  });
  it("should create a new struct with an id", () => {
    const { createdSimple } = simpleFactory;
    expect(createdSimple()).toEqual({
      _id: expect.stringMatching(OBJECT_ID_FORMAT),
      aVal: "test",
      createdAt: expect.stringMatching(ISO_DATETIME_FORMAT),
      updatedAt: expect.stringMatching(ISO_DATETIME_FORMAT),
    });
  });
  it("should create a new persisted struct", async () => {
    const { persistSimple } = simpleFactory;
    const simpleInstance = await persistSimple();
    expect(simpleInstance).toEqual({
      _id: expect.stringMatching(OBJECT_ID_FORMAT),
      aVal: "test",
      createdAt: expect.stringMatching(ISO_DATETIME_FORMAT),
      updatedAt: expect.stringMatching(ISO_DATETIME_FORMAT),
    });
    const allInstances = await simpleCollection.find({});
    expect(allInstances).toEqual([
      {
        ...simpleInstance,
        // eslint-disable-next-line no-underscore-dangle
        _id: ObjectID.createFromHexString(simpleInstance._id),
        createdAt: new Date(simpleInstance.createdAt),
        updatedAt: new Date(simpleInstance.updatedAt),
      },
    ]);
  });
});

describe("test pg factories", () => {
  let simpleTable = null;
  let complexTable = null;
  let schemaName = null;

  beforeAll(async () => {
    schemaName = `simpleTest-${Date.now()}`;
    await createSchema({
      schemaName,
      tableCreators: [simpleUuidTableCreator(false), complexTableCreator(false)],
    });
    simpleTable = simpleUuidRepoFactory({ schemaName, transformCase: false })();
    complexTable = complexRepoFactory({ schemaName, transformCase: false })();
    await ready();
  });

  afterAll(async () => {
    clearTableRegistry();
    await dropSchema({ schemaName });
    knex.destroy();
  });

  let simpleFactory;
  beforeEach(() => {
    simpleFactory = register("simple", simpleTable, (overrides) => ({
      aVal: "test",
      ...overrides(),
    }));
    simpleTable.table.knex.truncate();
  });

  it("should create a new struct without an id", () => {
    const { newSimple } = simpleFactory;
    expect(newSimple()).toEqual({ aVal: "test" });
  });
  it("should create a new struct with an id", () => {
    const { createdSimple } = simpleFactory;
    expect(createdSimple()).toEqual({
      id: expect.stringMatching(UUID_FORMAT),
      aVal: "test",
      createdAt: expect.stringMatching(ISO_DATETIME_FORMAT),
      updatedAt: expect.stringMatching(ISO_DATETIME_FORMAT),
    });
  });
  it("should create a new persisted struct", async () => {
    const { persistSimple } = simpleFactory;
    const simpleInstance = await persistSimple();
    expect(simpleInstance).toEqual({
      id: expect.stringMatching(UUID_FORMAT),
      aVal: "test",
      createdAt: expect.stringMatching(ISO_DATETIME_FORMAT),
    });
    const allInstances = await simpleTable.find({});
    expect(allInstances).toEqual([{ ...simpleInstance, createdAt: new Date(simpleInstance.createdAt) }]);
  });

  describe("test overrides", () => {
    it("should create a new struct without an id", () => {
      const { newSimple } = simpleFactory;
      expect(newSimple({ aVal: "test2" })).toEqual({ aVal: "test2" });
    });
  });

  describe("test dependencies", () => {
    let complexFactory;

    beforeEach(() => {
      complexFactory = register("complex", complexTable, async (overrides, getOrBuild) => {
        const simpleVal = await getOrBuild("simpleVal", _.noop);
        const simple = await getOrBuild("simple", simpleFactory, { aVal: simpleVal });
        const aComplexVal = await getOrBuild("aComplexVal", uuidv1);
        return {
          aComplexVal,
          simpleId: simple.id,
          ...overrides(),
        };
      });
    });

    it("should create a new struct without an id", async () => {
      const { newComplex } = complexFactory;
      expect(await newComplex()).toEqual({
        aComplexVal: expect.stringMatching(UUID_FORMAT),
        simpleId: expect.stringMatching(UUID_FORMAT),
      });
    });

    it("should create a new struct the override id", async () => {
      const { newComplex } = complexFactory;
      expect(await newComplex({ aComplexVal: "test2", simple: { id: 1 } })).toEqual({
        aComplexVal: "test2",
        simpleId: 1,
      });
    });

    it("when persisting it should create the simple, then the complex", async () => {
      const { createdComplex } = complexFactory;
      const complex = await createdComplex();
      expect(complex).toEqual({
        id: expect.stringMatching(UUID_FORMAT),
        aComplexVal: expect.stringMatching(UUID_FORMAT),
        createdAt: expect.stringMatching(ISO_DATETIME_FORMAT),
        updatedAt: expect.stringMatching(ISO_DATETIME_FORMAT),
        simpleId: expect.stringMatching(UUID_FORMAT),
      });
    });

    it("when persisting it should persist the simple, then the complex", async () => {
      const { persistComplex } = complexFactory;
      expect(await persistComplex()).toEqual({
        id: expect.stringMatching(UUID_FORMAT),
        aComplexVal: expect.stringMatching(UUID_FORMAT),
        createdAt: expect.stringMatching(ISO_DATETIME_FORMAT),
        simpleId: expect.stringMatching(UUID_FORMAT),
      });
    });

    it("if already persisted it only persist the complex", async () => {
      const { persistComplex } = complexFactory;
      const simpleId = uuidv1();
      expect(await persistComplex({ simple: { id: simpleId } })).toEqual({
        id: expect.stringMatching(UUID_FORMAT),
        aComplexVal: expect.stringMatching(UUID_FORMAT),
        createdAt: expect.stringMatching(ISO_DATETIME_FORMAT),
        simpleId,
      });
    });

    it("should be able to override a value in a child object", async () => {
      const { persistComplex } = complexFactory;
      const complex = await persistComplex({ simpleVal: "totalNewSimpleVal" });
      expect(complex).toEqual({
        id: expect.stringMatching(UUID_FORMAT),
        aComplexVal: expect.stringMatching(UUID_FORMAT),
        createdAt: expect.stringMatching(ISO_DATETIME_FORMAT),
        simpleId: expect.stringMatching(UUID_FORMAT),
      });
      expect(await simpleTable.findById(complex.simpleId)).toEqual({
        id: expect.stringMatching(UUID_FORMAT),
        aVal: "totalNewSimpleVal",
        createdAt: expect.any(Date),
      });
    });
  });
});
