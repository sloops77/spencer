const knex = require("knex");

const QueryBuilder = require("knex/lib/query/querybuilder");
const Raw = require("knex/lib/raw");
const SchemaBuilder = require("knex/lib/schema/builder");
const pkg = require("../src");
const { applyKnexDeferredResults } = require("../src/knex/augment-deferred-result");

function buildClient({ run }) {
  return {
    config: {
      asyncStackTraces: false,
      debug: false,
    },
    logger: {
      warn() {},
      error() {},
    },
    runner(builder) {
      return {
        run: () => run(builder),
      };
    },
  };
}

describe("knex deferred result", () => {
  beforeAll(() => {
    applyKnexDeferredResults();
  });

  it.each([
    ["query builder", QueryBuilder],
    ["raw", Raw],
    ["schema builder", SchemaBuilder],
  ])("adds deferResult to %s instances", (_label, Target) => {
    const builder = new Target(buildClient({ run: () => Promise.resolve("ok") }));
    const deferred = builder.deferResult();

    expect(typeof builder.deferResult).toBe("function");
    expect(typeof deferred.mapResult).toBe("function");
    expect(typeof deferred.catchResult).toBe("function");
    expect(typeof deferred.resolve).toBe("function");
    expect(typeof deferred.toBuilder).toBe("function");
    expect(deferred.toBuilder()).toBe(builder);
  });

  it("applies deferred map handlers in declaration order", async () => {
    const builder = new QueryBuilder(buildClient({ run: () => Promise.resolve(2) }));

    const result = await builder
      .deferResult()
      .mapResult((value) => value + 1)
      .mapResult((value) => value * 3)
      .resolve();

    expect(result).toBe(9);
  });

  it("allows deferred catch handlers to recover from runner failures", async () => {
    const builder = new QueryBuilder(
      buildClient({
        run: () => Promise.reject(new Error("query failed")),
      }),
    );

    const result = await builder
      .deferResult()
      .catchResult((error) => `recovered: ${error.message}`)
      .mapResult((value) => value.toUpperCase())
      .resolve();

    expect(result).toBe("RECOVERED: QUERY FAILED");
  });

  it("allows catchResult to handle errors thrown by mapResult", async () => {
    const builder = new QueryBuilder(buildClient({ run: () => Promise.resolve("ok") }));

    const result = await builder
      .deferResult()
      .mapResult(() => {
        throw new Error("boom");
      })
      .catchResult((error) => error.message)
      .resolve();

    expect(result).toBe("boom");
  });

  it("is awaitable without calling resolve explicitly", async () => {
    const builder = new QueryBuilder(buildClient({ run: () => Promise.resolve(2) }));

    const result = await builder.deferResult().mapResult((value) => value + 1);

    expect(result).toBe(3);
  });

  it("supports promise catch interop on deferred results", async () => {
    const builder = new QueryBuilder(
      buildClient({
        run: () => Promise.reject(new Error("query failed")),
      }),
    );

    const result = await builder.deferResult().catch((error) => `recovered: ${error.message}`);

    expect(result).toBe("recovered: query failed");
  });

  it("supports promise finally interop on deferred results", async () => {
    const builder = new QueryBuilder(buildClient({ run: () => Promise.resolve("ok") }));
    const onFinally = jest.fn();

    const result = await builder.deferResult().finally(onFinally);

    expect(result).toBe("ok");
    expect(onFinally).toHaveBeenCalledTimes(1);
  });

  it("leaves normal then behavior untouched when deferResult is not used", async () => {
    const builder = new QueryBuilder(buildClient({ run: () => Promise.resolve(2) }));

    const result = await builder.then((value) => value * 3);

    expect(result).toBe(6);
  });

  it("patches consumer knex instances when the package entrypoint is loaded", async () => {
    expect(pkg.knexFactory).toBeInstanceOf(Function);

    const consumerKnex = knex({ client: "pg" });

    try {
      const builder = consumerKnex.queryBuilder();
      const raw = consumerKnex.raw("select 1");

      expect(typeof builder.deferResult).toBe("function");
      expect(typeof raw.deferResult).toBe("function");
    } finally {
      await consumerKnex.destroy();
    }
  });
});
