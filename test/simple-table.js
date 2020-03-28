const { tableEffectsFactory } = require("../src");
const knex = require("../src/tables");

function simpleTableEffectsFactory(config) {
  return tableEffectsFactory({
    name: "simples",
    entityName: "simple",
    ...config,
  });
}

function simpleTableCreator(snakeCase) {
  return (schema) =>
    schema.createTable("simples", (table) => {
      table.text("id").primary();
      table.text(snakeCase ? "a_val" : "aVal");
      table
        .timestamp(snakeCase ? "created_at" : "createdAt")
        .defaultTo(knex.fn.now())
        .notNullable();
    });
}

function arraysTableEffectsFactory(config) {
  return tableEffectsFactory({
    name: "arrays",
    entityName: "array",
    ...config,
  });
}

function arrayTableCreator(snakeCase) {
  return (schema) =>
    schema.createTable("arrays", (table) => {
      table.text("id").primary();
      table.jsonb(snakeCase ? "many_vals" : "manyVals");
      table
        .timestamp(snakeCase ? "created_at" : "createdAt")
        .defaultTo(knex.fn.now())
        .notNullable();
    });
}


function examplesTableEffectsFactory(config) {
  return tableEffectsFactory({
    name: "examples",
    entityName: "example",
    ...config,
  });
}

function exampleTableCreator(snakeCase) {
  return (schema) =>
    schema.createTable("examples", (table) => {
      table.bigIncrements("id").primary();
      table.text(snakeCase ? "a_val" : "aVal");
      table.jsonb(snakeCase ? "many_vals" : "manyVals");
      table
        .timestamp(snakeCase ? "created_at" : "createdAt")
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
    contextRef: { current: context },
  };
}

module.exports = {
  simpleTableEffectsFactory,
  arraysTableEffectsFactory,
  examplesTableEffectsFactory,
  simpleTableCreator,
  arrayTableCreator,
  exampleTableCreator,
  testExtension,
};
