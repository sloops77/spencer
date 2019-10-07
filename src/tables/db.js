const _ = require("lodash/fp");
const knex = require("./index");

async function createSchema({ schemaName = "public", softDelete = false, tableCreators = [] } = {}) {
  await knex.raw(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  await knex.raw(`CREATE SCHEMA "${schemaName}"`);

  if (softDelete) {
    await knex.raw(`DROP SCHEMA IF EXISTS ${schemaName}_deleted CASCADE;`);
    await knex.raw(`CREATE SCHEMA ${schemaName}_deleted;`);
    await knex.raw(`DROP SCHEMA IF EXISTS ${schemaName}_combined CASCADE;`);
    await knex.raw(`CREATE SCHEMA ${schemaName}_combined;`);
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
