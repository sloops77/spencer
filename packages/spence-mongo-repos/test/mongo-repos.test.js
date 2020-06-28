/* eslint-disable no-underscore-dangle */

const _ = require("lodash/fp");
const shortid = require("shortid");
const { ObjectID } = require("mongodb");
const { log, env } = require("@spencejs/spence-core");

const { mongoFactory, mongoClose, mongoDb } = require("../src/mongodb");

const { clearTableRegistry, ready } = require("../src/repos/repo-registry");

describe("mongo repo persistence and queries", () => {
  let simpleTable = null;
  let arrayTable = null;
  const schemaName = shortid.generate();

  beforeAll(async () => {
    await mongoFactory({ log, config: env });
    const {
      // simpleTableCreator,
      simpleRepoFactory,
      // arrayTableCreator,
      arraysRepoFactory,
    } = require("./helpers/test-tables"); // eslint-disable-line global-require
    // await createSchema({
    //   schemaName,
    //   tableCreators: [simpleTableCreator(columnCase === "snake"), arrayTableCreator(columnCase === "snake")],
    // });
    simpleTable = simpleRepoFactory({ schemaName });
    arrayTable = arraysRepoFactory({ schemaName });
    await ready();
  });

  afterAll(async () => {
    clearTableRegistry();
    // delete schema tables?
    await mongoDb().dropCollection(`${schemaName}.simples`);
    await mongoDb().dropCollection(`${schemaName}.arrays`);
    await mongoClose();
  });

  function wrap(statements) {
    // if (transactions) {
    //   return knex.transaction((trx) => statements({ trx }));
    // }
    return statements();
  }

  it("should be able to insert", async () => {
    const val = { aVal: "foo" };
    const result = await wrap((context) => simpleTable(context).insert(val));
    expect(result).toEqual({
      _id: expect.any(ObjectID),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      ...val,
    });
  });

  it("test transaction behaviour", async () => {
    let insertedVal;
    const val = { id: Date.now().toString(), aVal: "foo" };
    const erroringStatements = wrap(async (context) => {
      insertedVal = await simpleTable(context).insert(val);
      await simpleTable(context).findById("1");
    });

    await expect(erroringStatements).rejects.toEqual(new Error("simple 1 not found"));
    const findResults = await simpleTable().find({ filter: { _id: insertedVal._id } });
    // if (transactions) {
    //   expect(findResults).toEqual([]);
    // } else {
    expect(findResults).toEqual([insertedVal]);
    // }
  });

  it("should be able to insertMany", async () => {
    const val = () => ({ aVal: "foo" });
    const vals = [val(), val(), val()];
    const result = await wrap(async (context) => simpleTable(context).insertMany(vals));
    const expected = _.map(
      (v) => ({ ...v, _id: expect.any(ObjectID), createdAt: expect.any(Date), updatedAt: expect.any(Date) }),
      vals
    );
    expect(result).toEqual(expected);

    const findResults = await simpleTable().find({ filter: { _id: { $in: _.map("_id", result) } } });
    expect(_.sortBy("_id", findResults)).toEqual(_.sortBy("_id", expected));
  });

  it("should be able to find by id", async () => {
    const val = { aVal: "foo" };
    const result = await wrap(async (context) => {
      const insertedVal = await simpleTable(context).insert(val);
      return simpleTable(context).findById(insertedVal._id);
    });

    expect(result).toEqual({
      ...val,
      _id: expect.any(ObjectID),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it("should be able to find using mongodb methods", async () => {
    const val = { aVal: "foo" };
    const result = await wrap(async (context) => {
      const insertedVal = await simpleTable(context).insert(val);
      return simpleTable(context)
        .collection()
        .findOne({ _id: insertedVal._id }, { projection: { _id: 1, createdAt: 1 } });
    });

    expect(result).toEqual({
      _id: expect.any(ObjectID),
      createdAt: expect.any(Date),
    });
  });

  it("should be able to count", async () => {
    const val = () => ({ aVal: "foo" });
    const vals = [val(), val(), val()];

    const result = await wrap(async (context) => {
      const insertedVals = await simpleTable(context).insertMany(vals);
      return simpleTable(context).count({ _id: { $in: _.map("_id", insertedVals) } });
    });

    expect(result).toEqual(3);
  });

  it("upsert should insert if doesnt exist already", async () => {
    const val = { _id: ObjectID(), aVal: "foo" };
    const result = await wrap(async (context) => simpleTable(context).upsert(val._id, val));
    expect(result).toEqual({ ...val, createdAt: expect.any(Date), updatedAt: expect.any(Date) });
  });
  it("upsert should update if it does exist already", async () => {
    const val = { _id: ObjectID(), aVal: "foo" };
    const result = await wrap(async (context) => {
      await simpleTable(context).insert(val);
      return simpleTable(context).upsert(val._id, { ...val, aVal: "boo" });
    });
    expect(result).toEqual({ ...val, aVal: "boo", createdAt: expect.any(Date), updatedAt: expect.any(Date) });
  });
  it("findOrInsert should insert if doesnt exist already", async () => {
    const val = { _id: ObjectID(), aVal: "foo" };
    const result = await wrap(async (context) => simpleTable(context).findOrInsert(val, ["_id"]));
    expect(result).toEqual({ ...val, createdAt: expect.any(Date), updatedAt: expect.any(Date) });
  });
  it("findOrInsert should find if it does exist already", async () => {
    const val = { _id: ObjectID(), aVal: "foo" };
    const result = await wrap(async (context) => {
      await simpleTable(context).insert(val);
      return simpleTable(context).findOrInsert({ ...val, aVal: "boo" }, ["_id"]);
    });
    expect(result).toEqual({ ...val, aVal: "foo", createdAt: expect.any(Date), updatedAt: expect.any(Date) });
  });

  it("should error if cannot be found", async () => {
    const result = wrap((context) => simpleTable(context).findById("1"));
    await expect(result).rejects.toEqual(new Error("simple 1 not found"));
  });
  it("should be able to find by filter", async () => {
    const val = { aVal: "unique" };
    await simpleTable().insert(val);

    await expect(wrap((context) => simpleTable(context).find({ filter: { aVal: "unique" } }))).resolves.toEqual([
      { ...val, _id: expect.any(ObjectID), createdAt: expect.any(Date), updatedAt: expect.any(Date) },
    ]);
  });
  it("find by filter should error if cannot be found", async () => {
    await expect(wrap(async (context) => simpleTable(context).find({ filter: { aVal: "notfound" } }))).resolves.toEqual(
      []
    );
  });
  it("should be able to update by id", async () => {
    const val = { aVal: "foo" };
    const insertedVal = await simpleTable().insert(val);
    const updatedVal = await wrap(async (context) => simpleTable(context).update(insertedVal._id, { aVal: "bar" }));
    expect(updatedVal).toEqual({ ...insertedVal, updatedAt: expect.any(Date), aVal: "bar" });
  });
  it("update should error if cannot be found", async () => {
    await expect(wrap(async (context) => simpleTable(context).update("1", { aVal: "bar" }))).rejects.toEqual(
      new Error("simple 1 not found")
    );
  });
  it("should be able to delete by id", async () => {
    const val = { aVal: "foo" };
    const insertedVal = await simpleTable().insert(val);
    expect(await wrap(async (context) => simpleTable(context).del(insertedVal._id))).toEqual(insertedVal._id);
    await expect(simpleTable().findById(val.id)).rejects.toEqual(new Error(`simple ${val.id} not found`));
  });
  it("delete should error if cannot be found", async () => {
    await expect(simpleTable().del("1")).rejects.toEqual(new Error("simple 1 not found"));
  });
  it("add to array integer primitives", async () => {
    const val = { manyVals: [] };
    const insertedVal = await arrayTable().insert(val);
    await expect(
      wrap(async (context) =>
        arrayTable(context)
          .collection()
          .findOneAndUpdate(
            { _id: insertedVal._id },
            { $push: { manyVals: { $each: [1, 3] } }, $set: { updatedAt: new Date() } },
            { projection: arrayTable(context).collection.defaultProjection, returnOriginal: false }
          )
          .then(_.get("value"))
      )
    ).resolves.toEqual({ ...insertedVal, manyVals: [1, 3], updatedAt: expect.any(Date) });
    // await expect(wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", [7, 9]))).resolves.toEqual([
    //   1,
    //   3,
    //   7,
    //   9,
    // ]);
    // await expect(wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", 11))).resolves.toEqual([
    //   1,
    //   3,
    //   7,
    //   9,
    //   11,
    // ]);
  });
  //
  // it("delete from array integer primitives", async () => {
  //   const val = { id: Date.now().toString(), manyVals: [1, 3, 5, 7, 9, 11] };
  //   await arrayTable().insert(val);
  //   await expect(wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", 7))).resolves.toEqual([
  //     1,
  //     3,
  //     5,
  //     9,
  //     11,
  //   ]);
  //   await expect(
  //     wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", [1, 9]))
  //   ).resolves.toEqual([3, 5, 11]);
  //   await expect(
  //     wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", [11, 2, 2, 5]))
  //   ).resolves.toEqual([3]);
  // });
  //
  // it("add to array string primitives", async () => {
  //   const val = { id: Date.now().toString(), manyVals: [] };
  //   await arrayTable().insert(val);
  //   await expect(
  //     wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", ["a", "b"]))
  //   ).resolves.toEqual(["a", "b"]);
  //   await expect(
  //     wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", ["c", "d"]))
  //   ).resolves.toEqual(["a", "b", "c", "d"]);
  //   await expect(wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", "e"))).resolves.toEqual([
  //     "a",
  //     "b",
  //     "c",
  //     "d",
  //     "e",
  //   ]);
  // });
  //
  // it("delete from array string primitives", async () => {
  //   const val = { id: Date.now().toString(), manyVals: ["a", "b", "c", "d", "e"] };
  //   await arrayTable().insert(val);
  //   await expect(
  //     wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", "c"))
  //   ).resolves.toEqual(["a", "b", "d", "e"]);
  //   await expect(
  //     wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", ["d", "e"]))
  //   ).resolves.toEqual(["a", "b"]);
  // });
  //
  // it("add to array objects", async () => {
  //   const val = { id: Date.now().toString(), manyVals: [] };
  //   await arrayTable().insert(val);
  //   await expect(
  //     wrap(async (context) =>
  //       arrayTable(context).addToArray(val.id, "manyVals", [
  //         { id: 1, a: "1" },
  //         { id: 2, a: "2" },
  //       ])
  //     )
  //   ).resolves.toEqual([
  //     { id: 1, a: "1" },
  //     { id: 2, a: "2" },
  //   ]);
  //   await expect(
  //     wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", { id: 3, a: "3" }))
  //   ).resolves.toEqual([
  //     { id: 1, a: "1" },
  //     { id: 2, a: "2" },
  //     { id: 3, a: "3" },
  //   ]);
  // });
  //
  // it("delete from array objects", async () => {
  //   const val = {
  //     id: Date.now().toString(),
  //     manyVals: [
  //       { id: 1, a: "1" },
  //       { id: 2, a: "2" },
  //       { id: 3, a: "3" },
  //     ],
  //   };
  //   await arrayTable().insert(val);
  //   await expect(
  //     wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", { id: 1, a: "1" }))
  //   ).resolves.toEqual([
  //     { id: 2, a: "2" },
  //     { id: 3, a: "3" },
  //   ]);
  // });
});
