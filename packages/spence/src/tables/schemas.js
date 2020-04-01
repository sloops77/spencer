const _ = require("lodash/fp");
const knex = require("../knex");

async function createSchema({ schemaName = "public", softDelete = false, tableCreators = [] } = {}) {
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

async function dropSchema({ schemaName = "public", softDelete = false }) {
  if (softDelete) {
    await knex.raw(`DROP SCHEMA IF EXISTS ${schemaName}_combined CASCADE;`);
    await knex.raw(`DROP SCHEMA IF EXISTS ${schemaName}_deleted CASCADE;`);
  }
  await knex.raw(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
}

module.exports = { createSchema, dropSchema };
