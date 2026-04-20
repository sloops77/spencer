const _ = require("lodash/fp");
const { knex: defaultKnex } = require("../knex");

function normalizeSchemaOptions(options) {
  const { knex, schemaName, softDelete, tableCreators } = options || {};

  return {
    knex: knex ?? defaultKnex(),
    schemaName: schemaName ?? "public",
    softDelete: softDelete ?? false,
    tableCreators: tableCreators ?? [],
  };
}

async function createSchema(options) {
  const { knex, schemaName, softDelete, tableCreators } = normalizeSchemaOptions(options);
  await knex.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

  if (softDelete) {
    await knex.raw(`CREATE SCHEMA IF NOT EXISTS ${schemaName}_deleted;`);
    await knex.raw(`CREATE SCHEMA IF NOT EXISTS ${schemaName}_combined;`);
  }

  if (_.isEmpty(tableCreators)) {
    return;
  }

  const schemaBuilder = knex.schema.withSchema([schemaName]);

  await _.reduce((acc, tableCreator) => tableCreator(acc), schemaBuilder, tableCreators);
}

async function dropSchema(options) {
  const { knex, schemaName, softDelete } = normalizeSchemaOptions(options);

  if (softDelete) {
    await knex.raw(`DROP SCHEMA IF EXISTS ${schemaName}_combined CASCADE;`);
    await knex.raw(`DROP SCHEMA IF EXISTS ${schemaName}_deleted CASCADE;`);
  }
  await knex.raw(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
}

module.exports = { createSchema, dropSchema };
