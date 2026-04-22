const _ = require("lodash/fp");
const { randomUUID } = require("node:crypto");
const { log, env } = require("@spencejs/spence-config");
const { knex, knexFactory } = require("../src/knex");
const { createSchema, dropSchema } = require("../src/tables/schemas");
const { clearTableRegistry, ready } = require("../src/repos/repo-registry");

beforeAll(() => {
  knexFactory({ log, config: env });
});

afterAll(async () => {
  await knex().destroy();
});

// describe('pg snake case', () => {
//   const columnCase = "snake";
//   const transactions = false;

// describe('pg camel case', () => {
//   const columnCase = "camel";
//   const transactions = true;

describe.each([[{ columnCase: "snake", transactions: false }], [{ columnCase: "camel", transactions: true }]])(
  "simple table %j",
  ({ columnCase, transactions }) => {
    let simpleTable = null;
    let arrayTable = null;
    const schemaName = `simple_test_${columnCase}_${Date.now()}`;

    beforeAll(async () => {
      const {
        simpleTableCreator,
        simpleRepoFactory,
        arrayTableCreator,
        arraysRepoFactory,
      } = require("./helpers/test-tables");
      await createSchema({
        schemaName,
        tableCreators: [simpleTableCreator(columnCase === "snake"), arrayTableCreator(columnCase === "snake")],
      });
      simpleTable = simpleRepoFactory({ schemaName, transformCase: columnCase === "snake" });
      arrayTable = arraysRepoFactory({ schemaName, transformCase: columnCase === "snake" });
      await ready();
    });

    function wrap(statements) {
      if (transactions) {
        return knex().transaction((trx) => statements({ trx }));
      }
      return statements();
    }

    afterAll(async () => {
      clearTableRegistry();
      await dropSchema({ schemaName });
    });

    it("should be able to insert", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      const result = await wrap((context) => simpleTable(context).insert(val).resolve());
      expect(result).toEqual({ ...val, createdAt: expect.any(Date) });
    });

    it("test transaction behaviour", async () => {
      let insertedVal;
      const val = { id: Date.now().toString(), aVal: "foo" };
      const erroringStatements = wrap(async (context) => {
        insertedVal = await simpleTable(context).insert(val).resolve();
        await simpleTable(context).findById("1").resolve();
      });

      await expect(erroringStatements).rejects.toEqual(new Error("simple 1 not found"));
      const findResults = await simpleTable().find({ filter: "id = ?", params: [insertedVal.id] });
      if (transactions) {
        expect(findResults).toEqual([]);
      } else {
        expect(findResults).toEqual([insertedVal]);
      }
    });

    it("should be able to insertMany", async () => {
      const val = () => ({ id: randomUUID(), aVal: "foo" });
      const vals = [val(), val(), val()];
      const result = await wrap(async (context) => simpleTable(context).insertMany(vals));
      const findResults = await simpleTable().find().whereIn("id", _.map("id", vals));
      const expected = _.map((v) => ({ ...v, createdAt: expect.any(Date) }), vals);
      expect(result).toEqual(_.map((value) => ({ isFulfilled: true, isRejected: false, value }), expected));
      expect(_.sortBy("id", findResults)).toEqual(_.sortBy("id", expected));
    });

    if (!transactions) {
      it("should include rejected results when insertMany cannot insert every value", async () => {
        const duplicateId = randomUUID();
        const vals = [
          { id: duplicateId, aVal: "first" },
          { id: duplicateId, aVal: "duplicate" },
          { id: randomUUID(), aVal: "insertMany-success" },
        ];

        const result = await simpleTable().insertMany(vals);
        const fulfilled = result.filter(({ isFulfilled }) => isFulfilled);
        const rejected = result.filter(({ isRejected }) => isRejected);
        const findResults = await simpleTable().find().whereIn("id", [duplicateId, vals[2].id]);

        expect(fulfilled).toHaveLength(2);
        expect(rejected).toHaveLength(1);
        expect(rejected[0]).toEqual({
          isFulfilled: false,
          isRejected: true,
          reason: expect.any(Error),
        });
        expect(_.sortBy("id", _.map("value", fulfilled))).toEqual(
          _.sortBy("id", [
            { id: duplicateId, aVal: expect.any(String), createdAt: expect.any(Date) },
            { ...vals[2], createdAt: expect.any(Date) },
          ]),
        );
        expect(_.sortBy("id", findResults)).toEqual(
          _.sortBy("id", [
            { id: duplicateId, aVal: expect.any(String), createdAt: expect.any(Date) },
            { ...vals[2], createdAt: expect.any(Date) },
          ]),
        );
      });
    }

    it("should be able to find by id", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      const result = await wrap(async (context) => {
        await simpleTable(context).insert(val).resolve();
        return simpleTable(context).findById(val.id).resolve();
      });

      expect(result).toEqual({ ...val, createdAt: expect.any(Date) });
    });

    it("should be able to find using knex methods", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      const result = await wrap(async (context) => {
        await simpleTable(context).insert(val).resolve();
        return simpleTable(context).find({}).where({ id: val.id }).deferResult().mapResult(_.first).resolve();
      });

      expect(result).toEqual({ ...val, createdAt: expect.any(Date) });
    });

    it("should be able to find one by filter", async () => {
      const val = { id: Date.now().toString(), aVal: "unique-find-one" };

      const result = await wrap(async (context) => {
        await simpleTable(context).insert(val).resolve();
        return simpleTable(context)
          .findOne({ filter: `${columnCase === "snake" ? "a_val" : '"aVal"'} = ?`, params: [val.aVal] })
          .resolve();
      });

      expect(result).toEqual({ ...val, createdAt: expect.any(Date) });
    });

    it("findOne should return undefined when the filter matches nothing", async () => {
      await expect(
        wrap((context) =>
          simpleTable(context)
            .findOne({ filter: `${columnCase === "snake" ? "a_val" : '"aVal"'} = ?`, params: ["notfound"] })
            .resolve(),
        ),
      ).resolves.toBeUndefined();
    });

    it("should apply default sort and normalize limit and offset", async () => {
      const olderVal = { id: "aaa", aVal: "older", createdAt: new Date("2024-01-01T00:00:00.000Z") };
      const newerVal = { id: "bbb", aVal: "newer", createdAt: new Date("2024-01-01T00:00:01.000Z") };
      const filter = `id in (?, ?)`;
      const params = [olderVal.id, newerVal.id];

      await wrap(async (context) => {
        await simpleTable(context).insert(olderVal).resolve();
        await simpleTable(context).insert(newerVal).resolve();
      });

      await expect(wrap((context) => simpleTable(context).find({ filter, params }))).resolves.toEqual([
        { ...newerVal, createdAt: expect.any(Date) },
        { ...olderVal, createdAt: expect.any(Date) },
      ]);

      await expect(wrap((context) => simpleTable(context).find({ filter, params, limit: "1", offset: "1" }))).resolves.toEqual(
        [{ ...olderVal, createdAt: expect.any(Date) }],
      );
    });

    it("should be able to count", async () => {
      const val = () => ({ id: randomUUID(), aVal: "foo" });
      const vals = [val(), val(), val()];

      const result = await wrap(async (context) => {
        await simpleTable(context).insertMany(vals);
        return simpleTable(context)
          .count({
            filter: `id in (${_.map(() => "?", vals).join(", ")})`,
            params: _.map("id", vals),
          })
          .resolve();
      });

      expect(result).toEqual(3);
    });

    it("upsert should insert if doesnt exist already", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      const result = await wrap(async (context) => simpleTable(context).upsert(val.id, val));
      expect(result).toEqual({ ...val, createdAt: expect.any(Date) });
    });
    it("upsert should update if it does exist already", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      const result = await wrap(async (context) => {
        await simpleTable(context).insert(val).resolve();
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
        await simpleTable(context).insert(val).resolve();
        return simpleTable(context).findOrInsert({ ...val, aVal: "boo" }, ["id"]);
      });
      expect(result).toEqual({ ...val, aVal: "foo", createdAt: expect.any(Date) });
    });

    it("should error if cannot be found", async () => {
      const result = wrap((context) => simpleTable(context).findById("1").resolve());
      await expect(result).rejects.toEqual(new Error("simple 1 not found"));
    });
    it("should be able to find by filter", async () => {
      const val = { id: Date.now().toString(), aVal: "unique" };
      await simpleTable().insert(val).resolve();

      await expect(
        wrap((context) =>
          simpleTable(context).find({ filter: `${columnCase === "snake" ? "a_val" : '"aVal"'} = 'unique'` }),
        ),
      ).resolves.toEqual([{ ...val, createdAt: expect.any(Date) }]);
    });
    it("find by filter should error if cannot be found", async () => {
      await expect(
        wrap(async (context) =>
          simpleTable(context).find({ filter: `${columnCase === "snake" ? "a_val" : '"aVal"'} = 'notfound'` }),
        ),
      ).resolves.toEqual([]);
    });
    it("should be able to update by id", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      await simpleTable().insert(val).resolve();
      const updatedVal = await wrap(async (context) => simpleTable(context).update(val.id, { aVal: "bar" }).resolve());
      expect(updatedVal).toEqual({ ...val, createdAt: expect.any(Date), aVal: "bar" });
    });

    it("should be able to update using a filter", async () => {
      const val = { id: Date.now().toString(), aVal: "filter-update-target" };
      await simpleTable().insert(val).resolve();

      const updatedVals = await wrap((context) =>
        simpleTable(context)
          .updateUsingFilter(
            { filter: `${columnCase === "snake" ? "a_val" : '"aVal"'} = ?`, params: [val.aVal] },
            { aVal: "filter-update-result" },
          )
          .resolve(),
      );

      expect(updatedVals).toEqual([{ ...val, createdAt: expect.any(Date), aVal: "filter-update-result" }]);
      await expect(
        simpleTable()
          .findOne({
            filter: `${columnCase === "snake" ? "a_val" : '"aVal"'} = ?`,
            params: ["filter-update-result"],
          })
          .resolve(),
      ).resolves.toEqual({ ...val, createdAt: expect.any(Date), aVal: "filter-update-result" });
    });

    it("updateUsingFilter should return an empty array when nothing matches", async () => {
      await expect(
        wrap((context) =>
          simpleTable(context)
            .updateUsingFilter(
              { filter: `${columnCase === "snake" ? "a_val" : '"aVal"'} = ?`, params: ["notfound"] },
              { aVal: "unused" },
            )
            .resolve(),
        ),
      ).resolves.toEqual([]);
    });

    it("update should error if cannot be found", async () => {
      await expect(
        wrap(async (context) => simpleTable(context).update("1", { aVal: "bar" }).resolve()),
      ).rejects.toEqual(new Error("simple 1 not found"));
    });
    it("should be able to delete by id", async () => {
      const val = { id: Date.now().toString(), aVal: "foo" };
      await simpleTable().insert(val).resolve();
      expect(await wrap(async (context) => simpleTable(context).del(val.id).resolve())).toEqual(val.id);
      await expect(simpleTable().findById(val.id).resolve()).rejects.toEqual(new Error(`simple ${val.id} not found`));
    });
    it("delete should error if cannot be found", async () => {
      // await expect(simpleTable(context).del("1")).rejects.toEqual(new Error("simple 1 not found"));
    });

    it("should be able to delete using a filter", async () => {
      const vals = [
        { id: randomUUID(), aVal: "delete-using-filter" },
        { id: randomUUID(), aVal: "delete-using-filter" },
        { id: randomUUID(), aVal: "keep-me" },
      ];

      await simpleTable().insertMany(vals);

      const deletedIds = await wrap((context) =>
        simpleTable(context)
          .delUsingFilter({
            filter: `${columnCase === "snake" ? "a_val" : '"aVal"'} = ?`,
            params: ["delete-using-filter"],
          }),
      );

      expect(_.sortBy(_.identity, deletedIds)).toEqual(_.sortBy(_.identity, _.map("id", vals.slice(0, 2))));
      await expect(simpleTable().find({ filter: "id = ?", params: [vals[2].id] })).resolves.toEqual([
        { ...vals[2], createdAt: expect.any(Date) },
      ]);
    });

    it("delUsingFilter should return an empty array when nothing matches", async () => {
      await expect(
        wrap((context) =>
          simpleTable(context)
            .delUsingFilter({
              filter: `${columnCase === "snake" ? "a_val" : '"aVal"'} = ?`,
              params: ["notfound"],
            }),
        ),
      ).resolves.toEqual([]);
    });

    it("add to array integer primitives", async () => {
      const val = { id: Date.now().toString(), manyVals: [] };
      await arrayTable().insert(val).resolve();
      await expect(
        wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", [1, 3]).resolve()),
      ).resolves.toEqual([1, 3]);
      await expect(
        wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", [7, 9]).resolve()),
      ).resolves.toEqual([1, 3, 7, 9]);
      await expect(
        wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", 11).resolve()),
      ).resolves.toEqual([1, 3, 7, 9, 11]);
    });

    it("delete from array integer primitives", async () => {
      const val = { id: Date.now().toString(), manyVals: [1, 3, 5, 7, 9, 11] };
      await arrayTable().insert(val).resolve();
      await expect(
        wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", 7).resolve()),
      ).resolves.toEqual([1, 3, 5, 9, 11]);
      await expect(
        wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", [1, 9]).resolve()),
      ).resolves.toEqual([3, 5, 11]);
      await expect(
        wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", [11, 2, 2, 5]).resolve()),
      ).resolves.toEqual([3]);
    });

    it("add to array string primitives", async () => {
      const val = { id: Date.now().toString(), manyVals: [] };
      await arrayTable().insert(val).resolve();
      await expect(
        wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", ["a", "b"]).resolve()),
      ).resolves.toEqual(["a", "b"]);
      await expect(
        wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", ["c", "d"]).resolve()),
      ).resolves.toEqual(["a", "b", "c", "d"]);
      await expect(
        wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", "e").resolve()),
      ).resolves.toEqual(["a", "b", "c", "d", "e"]);
    });

    it("delete from array string primitives", async () => {
      const val = { id: Date.now().toString(), manyVals: ["a", "b", "c", "d", "e"] };
      await arrayTable().insert(val).resolve();
      await expect(
        wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", "c").resolve()),
      ).resolves.toEqual(["a", "b", "d", "e"]);
      await expect(
        wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", ["d", "e"]).resolve()),
      ).resolves.toEqual(["a", "b"]);
    });

    it("add to array objects", async () => {
      const val = { id: Date.now().toString(), manyVals: [] };
      await arrayTable().insert(val).resolve();
      await expect(
        wrap(async (context) =>
          arrayTable(context)
            .addToArray(val.id, "manyVals", [
              { id: 1, a: "1" },
              { id: 2, a: "2" },
            ])
            .resolve(),
        ),
      ).resolves.toEqual([
        { id: 1, a: "1" },
        { id: 2, a: "2" },
      ]);
      await expect(
        wrap(async (context) => arrayTable(context).addToArray(val.id, "manyVals", { id: 3, a: "3" }).resolve()),
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
      await arrayTable().insert(val).resolve();
      await expect(
        wrap(async (context) => arrayTable(context).deleteFromArray(val.id, "manyVals", { id: 1, a: "1" }).resolve()),
      ).resolves.toEqual([
        { id: 2, a: "2" },
        { id: 3, a: "3" },
      ]);
    });
  },
);
