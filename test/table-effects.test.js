const knex = require("../src/tables");
const { createSchema, dropSchema } = require("../src/tables/db");

describe("simpleTable", () => {
  let simpleTable = null;
  let arrayTable = null;
  let schemaName = null;

  beforeAll(async () => {
    schemaName = `simpleTest-${Date.now()}`;
    // eslint-disable-next-line global-require
    const {
      simpleTableCreator,
      simpleTableEffectsFactory,
      arrayTableCreator,
      arraysTableEffectsFactory
    } = require("./simple-table");
    await createSchema({ schemaName, tableCreators: [simpleTableCreator, arrayTableCreator] });
    simpleTable = (await simpleTableEffectsFactory(schemaName))();
    arrayTable = (await arraysTableEffectsFactory(schemaName))();
  });

  afterAll(async () => {
    await dropSchema({ schemaName });
    await knex.destroy();
  });

  it("should be able to insert", async () => {
    const val = { id: Date.now().toString(), val: "foo" };
    const result = await simpleTable.insert(val);
    expect(result).toEqual({ ...val, createdAt: expect.any(Date) });
  });
  it("should be able to find by id", async () => {
    const val = { id: Date.now().toString(), val: "foo" };
    await simpleTable.insert(val);
    expect(await simpleTable.findById(val.id)).toEqual({ ...val, createdAt: expect.any(Date) });
  });
  it("upsert should insert if doesnt exist already", async () => {
    const val = { id: Date.now().toString(), val: "foo" };
    const result = await simpleTable.upsert(val.id, val);
    expect(result).toEqual({ ...val, createdAt: expect.any(Date) });
  });
  it("upsert should update if it does exist already", async () => {
    const val = { id: Date.now().toString(), val: "foo" };
    await simpleTable.insert(val);
    const result = await simpleTable.upsert(val.id, { ...val, val: "boo" });
    expect(result).toEqual({ ...val, val: "boo", createdAt: expect.any(Date) });
  });

  it("should error if cannot be found", async () => {
    await expect(simpleTable.findById("1")).rejects.toEqual(new Error("simple 1 not found"));
  });
  it("should be able to find by filter", async () => {
    const val = { id: Date.now().toString(), val: "unique" };
    await simpleTable.insert(val);
    expect(await simpleTable.find({ filter: "val = 'unique'" })).toEqual([{ ...val, createdAt: expect.any(Date) }]);
  });
  it("find by filter should error if cannot be found", async () => {
    await expect(await simpleTable.find({ filter: "val = 'notfound'" })).toEqual([]);
  });
  it("should be able to update by filter", async () => {
    const val = { id: Date.now().toString(), val: "foo" };
    await simpleTable.insert(val);
    const updatedVal = await simpleTable.update(val.id, { val: "bar" });
    expect(updatedVal).toEqual({ ...val, createdAt: expect.any(Date), val: "bar" });
  });
  it("update should error if cannot be found", async () => {
    await expect(simpleTable.update("1", { val: "bar" })).rejects.toEqual(new Error("simple 1 not found"));
  });
  it("should be able to delete by filter", async () => {
    const val = { id: Date.now().toString(), val: "foo" };
    await simpleTable.insert(val);
    expect(await simpleTable.del(val.id)).toEqual(val.id);
    await expect(simpleTable.findById(val.id)).rejects.toEqual(new Error(`simple ${val.id} not found`));
  });
  it("delete should error if cannot be found", async () => {
    // await expect(simpleTable.del("1")).rejects.toEqual(new Error("simple 1 not found"));
  });
  it("add to array primitives", async () => {
    const val = { id: Date.now().toString(), vals: [] };
    await arrayTable.insert(val);
    await expect(arrayTable.addToArray(val.id, "vals", [1, 3])).resolves.toEqual([1, 3]);
    await expect(arrayTable.addToArray(val.id, "vals", [7, 9])).resolves.toEqual([1, 3, 7, 9]);
    await expect(arrayTable.addToArray(val.id, "vals", 11)).resolves.toEqual([1, 3, 7, 9, 11]);
  });

  it("delete from array items", async () => {
    const val = { id: Date.now().toString(), vals: [1, 3, 5, 7, 9, 11] };
    await arrayTable.insert(val);
    await expect(arrayTable.deleteFromArray(val.id, "vals", 7)).resolves.toEqual([1, 3, 5, 9, 11]);
    // await expect(arrayTable.deleteFromArray(val.id, "vals", [1, 9])).resolves.toEqual([3, 5, 11]);
    // await expect(arrayTable.deleteFromArray(val.id, "vals", [11, 2, 2, 5])).resolves.toEqual([3]);
  });

  it("add to array objects", async () => {
    const val = { id: Date.now().toString(), vals: [] };
    await arrayTable.insert(val);
    await expect(arrayTable.addToArray(val.id, "vals", [{ id: 1, a: "1" }, { id: 2, a: "2" }])).resolves.toEqual([
      { id: 1, a: "1" },
      { id: 2, a: "2" }
    ]);
    await expect(arrayTable.addToArray(val.id, "vals", { id: 3, a: "3" })).resolves.toEqual([
      { id: 1, a: "1" },
      { id: 2, a: "2" },
      { id: 3, a: "3" }
    ]);
  });

  it("delete from array objects", async () => {
    const val = { id: Date.now().toString(), vals: [{ id: 1, a: "1" }, { id: 2, a: "2" }, { id: 3, a: "3" }] };
    await arrayTable.insert(val);
    await expect(arrayTable.deleteFromArray(val.id, "vals", { id: 1, a: "1" })).resolves.toEqual([
      { id: 2, a: "2" },
      { id: 3, a: "3" }
    ]);
  });
});
