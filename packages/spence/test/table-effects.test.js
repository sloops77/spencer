const knex = require("../src/knex");
const { createSchema, dropSchema } = require("../src/tables/schemas");
const { clearTableRegistry, ready } = require("../src/table-effects/table-registry");

afterAll(async () => {
  await knex.destroy();
});

describe.each([[{ columnCase: "snake", transactions: false }], [{ columnCase: "camel", transactions: true }]])(
  "simple table %j",
  ({ columnCase, transactions }) => {
    let simpleTable = null;
    let arrayTable = null;
    const schemaName = `simple_test_${columnCase}_${Date.now()}`;

    beforeAll(async () => {
      const {
        simpleTableCreator,
        simpleTableEffectsFactory,
        arrayTableCreator,
        arraysTableEffectsFactory,
      } = require("./test-tables"); // eslint-disable-line global-require
      await createSchema({
        schemaName,
        tableCreators: [simpleTableCreator(columnCase === "snake"), arrayTableCreator(columnCase === "snake")],
      });
      simpleTable = simpleTableEffectsFactory({ schemaName, transformCase: columnCase === "snake" });
      arrayTable = arraysTableEffectsFactory({ schemaName, transformCase: columnCase === "snake" });
      await ready();
    });

    function wrap(statements) {
      if (transactions) {
        return knex.transaction((trx) => statements({ trx }));
      }
      return statements();
    }

    afterAll(async () => {
      clearTableRegistry();
      await dropSchema({ schemaName });
    });

    it("should be able to insert", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      const result = await wrap((context) => simpleTable(context).insert(val));
      expect(result).toEqual({ ...val, createdAt: expect.any(Date) });
    });

    it("test transaction behaviour", async () => {
      let insertedVal;
      const val = { id: Date.now().toString(), aVal: "foo" };
      const erroringStatements = wrap(async (context) => {
        insertedVal = await simpleTable(context).insert(val);
        await simpleTable(context).findById("1");
      });

      await expect(erroringStatements).rejects.toEqual(new Error("simple 1 not found"));
      const findResults = await simpleTable().find({ filter: "id = ?", params: [insertedVal.id] });
      if (transactions) {
        expect(findResults).toEqual([]);
      } else {
        expect(findResults).toEqual([insertedVal]);
      }
    });
    it("should be able to find by id", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      const result = await wrap(async (context) => {
        await simpleTable(context).insert(val);
        return simpleTable(context).findById(val.id);
      });

      expect(result).toEqual({ ...val, createdAt: expect.any(Date) });
    });

    it("should be able to find using knex methods", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      const result = await wrap(async (context) => {
        await simpleTable(context).insert(val);
        return simpleTable(context).findOne({}).where({ id: val.id });
      });

      expect(result).toEqual({ ...val, createdAt: expect.any(Date) });
    });

    it("upsert should insert if doesnt exist already", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      const result = await wrap(async (context) => simpleTable(context).upsert(val.id, val));
      expect(result).toEqual({ ...val, createdAt: expect.any(Date) });
    });
    it("upsert should update if it does exist already", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      const result = await wrap(async (context) => {
        await simpleTable(context).insert(val);
        return simpleTable(context).upsert(val.id, { ...val, aVal: "boo" });
      });
      expect(result).toEqual({ ...val, aVal: "boo", createdAt: expect.any(Date) });
    });
    it("findOrInsert should insert if doesnt exist already", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      const result = await wrap(async (context) => simpleTable(context).findOrInsert(val, ["id"]));
      expect(result).toEqual({ ...val, createdAt: expect.any(Date) });
    });
    it("findOrInsert should find if it does exist already", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      const result = await wrap(async (context) => {
        await simpleTable(context).insert(val);
        return simpleTable(context).findOrInsert({ ...val, aVal: "boo" }, ["id"]);
      });
      expect(result).toEqual({ ...val, aVal: "foo", createdAt: expect.any(Date) });
    });

    it("should error if cannot be found", async () => {
      const result = wrap((context) => simpleTable(context).findById("1"));
      await expect(result).rejects.toEqual(new Error("simple 1 not found"));
    });
    it("should be able to find by filter", async () => {
      const val = { id: Date.now().toString(), aVal: "unique" };
      await simpleTable().insert(val);

      await expect(
        wrap((context) =>
          simpleTable(context).find({ filter: `${columnCase === "snake" ? "a_val" : '"aVal"'} = 'unique'` })
        )
      ).resolves.toEqual([{ ...val, createdAt: expect.any(Date) }]);
    });
    it("find by filter should error if cannot be found", async () => {
      await expect(
        wrap(async (context) =>
          simpleTable(context).find({ filter: `${columnCase === "snake" ? "a_val" : '"aVal"'} = 'notfound'` })
        )
      ).resolves.toEqual([]);
    });
    it("should be able to update by id", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      await simpleTable().insert(val);
      const updatedVal = await wrap(async (context) => simpleTable(context).update(val.id, { aVal: "bar" }));
      expect(updatedVal).toEqual({ ...val, createdAt: expect.any(Date), aVal: "bar" });
    });
    it("update should error if cannot be found", async () => {
      await expect(wrap(async (context) => simpleTable(context).update("1", { aVal: "bar" }))).rejects.toEqual(
        new Error("simple 1 not found")
      );
    });
    it("should be able to delete by id", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      await simpleTable().insert(val);
      expect(await wrap(async (context) => simpleTable(context).del(val.id))).toEqual(val.id);
      await expect(simpleTable().findById(val.id)).rejects.toEqual(new Error(`simple ${val.id} not found`));
    });
    it("delete should error if cannot be found", async () => {
      // await expect(simpleTable(context).del("1")).rejects.toEqual(new Error("simple 1 not found"));
    });
    it("add to array integer primitives", async () => {
      const val = { id: Date.now().toString(), manyVals: [] };
      await arrayTable().insert(val);
      await expect(
        wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", [1, 3]))
      ).resolves.toEqual([1, 3]);
      await expect(
        wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", [7, 9]))
      ).resolves.toEqual([1, 3, 7, 9]);
      await expect(wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", 11))).resolves.toEqual([
        1,
        3,
        7,
        9,
        11,
      ]);
    });

    it("delete from array integer primitives", async () => {
      const val = { id: Date.now().toString(), manyVals: [1, 3, 5, 7, 9, 11] };
      await arrayTable().insert(val);
      await expect(
        wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", 7))
      ).resolves.toEqual([1, 3, 5, 9, 11]);
      await expect(
        wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", [1, 9]))
      ).resolves.toEqual([3, 5, 11]);
      await expect(
        wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", [11, 2, 2, 5]))
      ).resolves.toEqual([3]);
    });

    it("add to array string primitives", async () => {
      const val = { id: Date.now().toString(), manyVals: [] };
      await arrayTable().insert(val);
      await expect(
        wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", ["a", "b"]))
      ).resolves.toEqual(["a", "b"]);
      await expect(
        wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", ["c", "d"]))
      ).resolves.toEqual(["a", "b", "c", "d"]);
      await expect(wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", "e"))).resolves.toEqual([
        "a",
        "b",
        "c",
        "d",
        "e",
      ]);
    });

    it("delete from array string primitives", async () => {
      const val = { id: Date.now().toString(), manyVals: ["a", "b", "c", "d", "e"] };
      await arrayTable().insert(val);
      await expect(
        wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", "c"))
      ).resolves.toEqual(["a", "b", "d", "e"]);
      await expect(
        wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", ["d", "e"]))
      ).resolves.toEqual(["a", "b"]);
    });

    it("add to array objects", async () => {
      const val = { id: Date.now().toString(), manyVals: [] };
      await arrayTable().insert(val);
      await expect(
        wrap(async (context) =>
          arrayTable(context).addToArray(val.id, "manyVals", [
            { id: 1, a: "1" },
            { id: 2, a: "2" },
          ])
        )
      ).resolves.toEqual([
        { id: 1, a: "1" },
        { id: 2, a: "2" },
      ]);
      await expect(
        wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", { id: 3, a: "3" }))
      ).resolves.toEqual([
        { id: 1, a: "1" },
        { id: 2, a: "2" },
        { id: 3, a: "3" },
      ]);
    });

    it("delete from array objects", async () => {
      const val = {
        id: Date.now().toString(),
        manyVals: [
          { id: 1, a: "1" },
          { id: 2, a: "2" },
          { id: 3, a: "3" },
        ],
      };
      await arrayTable().insert(val);
      await expect(
        wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", { id: 1, a: "1" }))
      ).resolves.toEqual([
        { id: 2, a: "2" },
        { id: 3, a: "3" },
      ]);
    });
  }
);
