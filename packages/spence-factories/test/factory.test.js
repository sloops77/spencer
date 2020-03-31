const _ = require("lodash/fp");
const {
  simpleUuidTableCreator,
  simpleUuidTableEffectsFactory,
  complexTableCreator,
  complexTableEffectsFactory,
} = require("@spence/spence/test/test-tables"); // eslint-disable-line global-require
const uuidv1 = require("uuid/v1");
const { register } = require("../src/factory");
const knex = require("../../spence/src/tables");
const { createSchema, dropSchema } = require("../../spence/src/tables/db");
const { clearTableRegistry } = require("../../spence/src/table-effects/table-registry");
const { UUID_FORMAT, ISO_DATETIME_FORMAT } = require("../../spence/test/helpers/regexes");

describe("test factories", () => {
  let simpleTable = null;
  let complexTable = null;
  let schemaName = null;

  beforeAll(async () => {
    schemaName = `simpleTest-${Date.now()}`;
    await createSchema({
      schemaName,
      tableCreators: [simpleUuidTableCreator(false), complexTableCreator(false)],
    });
    simpleTable = (await simpleUuidTableEffectsFactory({ schemaName, transformCase: false }))();
    complexTable = (await complexTableEffectsFactory({ schemaName, transformCase: false }))();
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
      ...overrides,
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
      complexFactory = register(
        "complex",
        complexTable,
        async (overrides, simpleFactory1) => {
          const simple = _.getOr(await simpleFactory1(), "simple", overrides);
          return {
            aComplexVal: "test",
            simpleId: simple.id,
            ..._.omit(["simple"], overrides),
          };
        },
        [simpleFactory]
      );
    });

    it("should create a new struct without an id", async () => {
      const { newComplex } = complexFactory;
      expect(await newComplex()).toEqual({ aComplexVal: "test" });
    });

    it("should create a new struct the override id", async () => {
      const { newComplex } = complexFactory;
      expect(await newComplex({ aComplexVal: "test2", simple: { id: 1 } })).toEqual({
        aComplexVal: "test2",
        simpleId: 1,
      });
    });

    it("when persisting it should persist the simple, then the complex", async () => {
      const { persistComplex } = complexFactory;
      expect(await persistComplex()).toEqual({
        id: expect.stringMatching(UUID_FORMAT),
        aComplexVal: "test",
        createdAt: expect.stringMatching(ISO_DATETIME_FORMAT),
        simpleId: expect.stringMatching(UUID_FORMAT),
      });
    });

    it("if already persisted it only persist the complex", async () => {
      const { persistComplex } = complexFactory;
      const simpleId = uuidv1();
      expect(await persistComplex({ simple: { id: simpleId } })).toEqual({
        id: expect.stringMatching(UUID_FORMAT),
        aComplexVal: "test",
        createdAt: expect.stringMatching(ISO_DATETIME_FORMAT),
        simpleId,
      });
    });
  });
});
