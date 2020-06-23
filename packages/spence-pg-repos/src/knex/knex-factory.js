const { types } = require("pg");
const initKnex = require("knex");
const flow = require("lodash/fp/flow");
const pick = require("lodash/fp/pick");
const pickBy = require("lodash/fp/pickBy");
const isNil = require("lodash/fp/isNil");
const map = require("lodash/fp/map");
const {
  log,
  env: { nodeEnv, connection },
} = require("@spencejs/spence-core");
const { dbifyColumn, apifyResult, apifyResultArray } = require("./transformations");

const compactObj = pickBy((x) => !isNil(x));

const DATE_OID = 1082;
const parseDate = (value) => value;

types.setTypeParser(DATE_OID, parseDate);

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

function knexFactory() {
  return initKnex({
    client: "pg",
    connection,
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
}

module.exports = knexFactory;
