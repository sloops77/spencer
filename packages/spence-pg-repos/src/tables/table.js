const _ = require("lodash/fp");
const { v4: uuidv4 } = require("uuid");

const { knexPromise, knex } = require("../knex");

async function buildColumnInfoFromDb(table, ignoreColumns) {
  const rawColumnInfo = await table().columnInfo();
  return _.fromPairs(
    _.flow(
      _.reject((columnName) => ignoreColumns.includes(columnName)),
      _.map((columnName) => [columnName, rawColumnInfo[columnName].type])
    )(_.keys(rawColumnInfo))
  );
}

function init(
  {
    name,
    schemaName = "public",
    entityName,
    ignoreColumns = [],
    transformCase,
    timestampKeys = { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
  ready
) {
  // eslint-disable-next-line no-underscore-dangle
  let _columnInfo;
  // eslint-disable-next-line no-underscore-dangle
  let _knexInstance;

  knexPromise
    .then((knexInstance) => {
      _knexInstance = knexInstance;
    })
    .then(() => buildColumnInfoFromDb(tableFn, ignoreColumns))
    .then((result) => {
      _columnInfo = result;
      ready();
    })
    .catch(ready);

  function tableFn(context = {}) {
    const knexTable = connection(context)(name);
    return schemaName ? knexTable.withSchema(schemaName) : knexTable;
  }

  function connection(context) {
    return (context && context.trx) || _knexInstance;
  }

  const table = Object.assign(tableFn, {
    schemaName,
    tableName: name,
    entityName,
    connection,
    transformCase,
    timestampKeys,
    mockIdGenerator: uuidv4,
  });
  Object.defineProperty(table, "columnInfo", {
    get() {
      if (_columnInfo == null) {
        throw new Error("Table not initialized yet. Wait for the ready() signal");
      }
      return _columnInfo;
    },
  });

  Object.defineProperty(table, "columnNames", {
    get() {
      if (_columnInfo == null) {
        throw new Error("Table not initialized yet. Wait for the ready() signal");
      }
      return _.keys(_columnInfo);
    },
  });

  Object.defineProperty(table, "knex", {
    get() {
      if (_knexInstance == null) {
        throw new Error("Knex not initialized yet. Wait for the ready() signal");
      }
      return _knexInstance;
    },
  });

  return table;
}

module.exports = init;
