async function up(knex, schema, tableName) {
  await knex.raw(
    `CREATE TABLE ${schema}_deleted.${tableName} (
        "deletedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        LIKE ${schema}.${tableName} INCLUDING ALL);`
  );

  return knex.raw(
    `CREATE VIEW  ${schema}_combined.${tableName} AS
        SELECT null AS "deletedAt", * FROM ${schema}.${tableName}
        UNION ALL
        SELECT * FROM  ${schema}_deleted.${tableName};`
  );
}

async function down(knex, schema, tableName) {
  await knex.raw(`DROP VIEW ${schema}_combined.${tableName}`);
  return knex.schema.withSchema(`${schema}_deleted`).dropTable(tableName);
}

module.exports = { up, down };
