const _ = require("lodash/fp");
const { createSchema } = require("../packages/spence/src");
const { getSchema } = require("./shared/get-schema");

exports.up = function(knex) {
  return createSchema({ knex, softDelete: true }).then(() => {
    const schema = getSchema(knex);
    return knex.raw(`create extension if not exists "uuid-ossp" SCHEMA ${schema}`).then(() =>
      knex.raw(
        `CREATE OR REPLACE FUNCTION ${schema}.trigger_set_timestamp()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW."updatedAt" = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;`
      )
    );
  });
};

exports.down = function(knex) {};

// exports.config = { transaction: false };
