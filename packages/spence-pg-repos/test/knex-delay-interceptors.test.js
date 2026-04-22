const knex = require("knex");

const QueryBuilder = require("knex/lib/query/querybuilder");
const Raw = require("knex/lib/raw");
const SchemaBuilder = require("knex/lib/schema/builder");
const pkg = require("../src");
const { applyKnexDelayInterceptors } = require("../src/knex/augment-delay-interceptors");

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

describe("knex delay interceptors", () => {
  beforeAll(() => {
    applyKnexDelayInterceptors();
  });

  it.each([
    ["query builder", QueryBuilder],
    ["raw", Raw],
    ["schema builder", SchemaBuilder],
  ])("adds delayThen and delayCatch to %s instances", (_label, Target) => {
    const builder = new Target(buildClient({ run: () => Promise.resolve("ok") }));

    expect(typeof builder.delayThen).toBe("function");
    expect(typeof builder.delayCatch).toBe("function");
    expect(builder.delayThen((value) => value)).toBe(builder);
    expect(builder.delayCatch((error) => error)).toBe(builder);
  });

  it("applies delayed then interceptors in declaration order", async () => {
    const builder = new QueryBuilder(buildClient({ run: () => Promise.resolve(2) }));

    const result = await builder
      .delayThen((value) => value + 1)
      .delayThen((value) => value * 3)
      .then();

    expect(result).toBe(9);
  });

  it("allows delayed catch interceptors to recover from runner failures", async () => {
    const builder = new QueryBuilder(
      buildClient({
        run: () => Promise.reject(new Error("query failed")),
      }),
    );

    const result = await builder
      .delayCatch((error) => `recovered: ${error.message}`)
      .delayThen((value) => value.toUpperCase())
      .then();

    expect(result).toBe("RECOVERED: QUERY FAILED");
  });

  it("allows delayCatch to handle errors thrown by delayed then interceptors", async () => {
    const builder = new QueryBuilder(buildClient({ run: () => Promise.resolve("ok") }));

    const result = await builder
      .delayThen(() => {
        throw new Error("boom");
      })
      .delayCatch((error) => error.message)
      .then();

    expect(result).toBe("boom");
  });

  it("preserves standard then handlers after delayed interceptors", async () => {
    const builder = new QueryBuilder(buildClient({ run: () => Promise.resolve(2) }));

    const result = await builder
      .delayThen((value) => value + 1)
      .then(
        (value) => value * 3,
        () => "unexpected rejection",
      );

    expect(result).toBe(9);
  });

  it("patches consumer knex instances when the package entrypoint is loaded", async () => {
    expect(pkg.knexFactory).toBeInstanceOf(Function);

    const consumerKnex = knex({ client: "pg" });

    try {
      const builder = consumerKnex.queryBuilder();
      const raw = consumerKnex.raw("select 1");

      expect(typeof builder.delayThen).toBe("function");
      expect(typeof raw.delayCatch).toBe("function");
    } finally {
      await consumerKnex.destroy();
    }
  });
});
