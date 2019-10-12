const { types } = require("pg");
const initKnex = require("knex");
const pick = require("lodash/fp/pick");
const pickBy = require("lodash/fp/pickBy");
const isNil = require("lodash/fp/isNil");
const log = require("../log");
const { nodeEnv, connection } = require("../env");

const compactObj = pickBy(x => !isNil(x));

const DATE_OID = 1082;
const parseDate = value => value;

types.setTypeParser(DATE_OID, parseDate);

const pool =
  nodeEnv !== "test"
    ? {
        min: 2,
        max: 10
      }
    : {
        min: 1,
        max: 1
      };

const knexFactory = () =>
  initKnex({
    client: "pg",
    connection,
    debug: false,
    pool,
    postProcessResponse: result => {
      // TODO: add special case for raw results (depends on dialect)
      if (Array.isArray(result)) {
        return result.map(row => compactObj(row));
      }
      return compactObj(result);
    },
    log: {
      debug: obj => log.debug(pick(["method", "bindings", "sql"], obj)),
      warn: log.warn.bind(log),
      error: log.error.bind(log)
    }
  });

module.exports = knexFactory;
