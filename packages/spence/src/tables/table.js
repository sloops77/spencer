const _ = require("lodash/fp");
const traverse = require("json-schema-traverse");

const knex = require("../knex");

function buildColumnInfoFromSchema(schema) {
  const columnInfo = {};
  traverse(schema, {
    cb: (...args) => {
      if (!_.isString(args[args.length - 1])) {
        return;
      }

      columnInfo[args[args.length - 1]] = "string";
    },
  });
  return Promise.resolve(columnInfo);
}

async function buildColumnInfoFromDb(table, ignoreColumns) {
  const rawColumnInfo = await table().columnInfo();
  return _.fromPairs(
    _.flow(
      _.reject((columnName) => ignoreColumns.includes(columnName)),
      _.map((columnName) => [columnName, rawColumnInfo[columnName].type])
    )(_.keys(rawColumnInfo))
  );
}

function init({ name, schemaName = "public", entityName, jsonSchema, ignoreColumns = [] }) {
  function table(context = {}) {
    const knexTable = context.trx != null ? context.trx(name) : knex(name);
    return schemaName ? knexTable.withSchema(schemaName) : knexTable;
  }

  const columnInfo =
    jsonSchema != null ? buildColumnInfoFromSchema(jsonSchema) : buildColumnInfoFromDb(table, ignoreColumns);

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
