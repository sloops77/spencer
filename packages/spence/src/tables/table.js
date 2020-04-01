const _ = require("lodash/fp");

const knex = require("../knex");

async function buildColumnInfoFromDb(table, ignoreColumns) {
  const rawColumnInfo = await table().columnInfo();
  return _.fromPairs(
    _.flow(
      _.reject((columnName) => ignoreColumns.includes(columnName)),
      _.map((columnName) => [columnName, rawColumnInfo[columnName].type])
    )(_.keys(rawColumnInfo))
  );
}

function init({ name, schemaName = "public", entityName, ignoreColumns = [] }) {
  function table(context = {}) {
    const knexTable = context.trx != null ? context.trx(name) : knex(name);
    return schemaName ? knexTable.withSchema(schemaName) : knexTable;
  }

  const columnInfo = buildColumnInfoFromDb(table, ignoreColumns);

  return Object.assign(table, {
    schemaName,
    tableName: name,
    entityName,
    columnInfo,
    knex,
    get columnNames() {
      return columnInfo.then(_.keys);
    },
  });
}

module.exports = init;
