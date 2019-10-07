const { tableEffectsFactory } = require("../src");
const knex = require("../src/tables");

function simpleTableEffectsFactory(schemaName, extensions) {
  return tableEffectsFactory({
    name: "simples",
    entityName: "simple",
    schemaName,
    extensions
  });
}

function simpleTableCreator(schema) {
  return schema.createTable("simples", table => {
    table.text("id").primary();
    table.text("val");
    table
      .timestamp("createdAt")
      .defaultTo(knex.fn.now())
      .notNullable();
  });
}

function arraysTableEffectsFactory(schemaName, extensions) {
  return tableEffectsFactory({
    name: "arrays",
    entityName: "array",
    schemaName,
    extensions
  });
}

function arrayTableCreator(schema) {
  return schema.createTable("arrays", table => {
    table.text("id").primary();
    table.jsonb("vals");
    table
      .timestamp("createdAt")
      .defaultTo(knex.fn.now())
      .notNullable();
  });
}

function testExtension(parent, context) {
  const callCounterRef = { current: 0 };
  return {
    insert(val, selection) {
      callCounterRef.current += 1;

      return parent.insert(val, selection);
    },
    callCounterRef,
    contextRef: { current: context }
  };
}

module.exports = {
  simpleTableEffectsFactory,
  arraysTableEffectsFactory,
  simpleTableCreator,
  arrayTableCreator,
  testExtension
};
