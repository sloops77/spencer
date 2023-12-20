const { types } = require("pg");
const { knex: initKnex } = require("knex");
const flow = require("lodash/fp/flow");
const pick = require("lodash/fp/pick");
const pickBy = require("lodash/fp/pickBy");
const isNil = require("lodash/fp/isNil");
const map = require("lodash/fp/map");
const { dbifyColumn, apifyResult, apifyResultArray } = require("./transformations");

const compactObj = pickBy((x) => !isNil(x));

const DATE_OID = 1082;
const parseDate = (value) => value;
let knexInstance = null;
let lastConnection = null;
let knexResolver;

function knex(...args) {
  if (lastConnection == null) {
    throw new Error(`Knex not initialized yet. Call knexFactory() before using knex()`);
  }

  if (args.length) {
    return knexInstance(...args);
  }

  return knexInstance;
}

const knexPromise = new Promise((resolve) => {
  knexResolver = resolve;
});

function knexClose() {
  return knex().destroy();
}

types.setTypeParser(DATE_OID, parseDate);

function knexFactory({ log, config: { nodeEnv, pgConnection } }) {
  if (pgConnection === lastConnection) {
    throw new Error(
      `Initializiong knex twice to ${pgConnection} is not possible. Please remove one of the initializations`,
    );
  }

  lastConnection = pgConnection;
  const pool =
    nodeEnv !== "test"
      ? {
          min: 2,
          max: 10,
        }
      : {
          min: 1,
          max: 1,
        };

  knexInstance = initKnex({
    client: "pg",
    connection: pgConnection,
    debug: false,
    asyncStackTraces: nodeEnv !== "production",
    acquireConnectionTimeout: nodeEnv !== "production" ? 3000 : 30000,
    pool,
    wrapIdentifier(value, origImpl, { transformCase } = {}) {
      return origImpl(dbifyColumn(transformCase)(value));
    },
    postProcessResponse(result, { transformCase } = {}) {
      // TODO: add special case for raw results (depends on dialect)
      if (Array.isArray(result)) {
        return flow(map(compactObj), apifyResultArray(transformCase))(result);
      }
      return apifyResult(transformCase)(compactObj(result));
    },
    log: {
      debug: (obj) => log.debug(pick(["method", "bindings", "sql"], obj)),
      warn: log.warn.bind(log),
      error: log.error.bind(log),
    },
  });

  knexResolver(knexInstance);

  return knexInstance;
}

module.exports = { knexFactory, knex, knexClose, knexPromise };
