function getSchema(knex) {
  return knex.migrate.config.schemaName || "public";
}

function getAllTableSchemas(knex) {
  const baseSchema = getSchema(knex);
  return [baseSchema, `${baseSchema}_deleted`];
}

function getAllSchemas(knex) {
  const baseSchema = getSchema(knex);
  return [baseSchema, `${baseSchema}_deleted`, `${baseSchema}_combined`];
}

module.exports = { getSchema, getAllSchemas, getAllTableSchemas };
