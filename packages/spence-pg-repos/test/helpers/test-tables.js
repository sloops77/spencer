const { repoFactory } = require("../../src");
const { knex } = require("../../src/knex");

function simpleRepoFactory(config) {
  return repoFactory({
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
        .defaultTo(knex().fn.now())
        .notNullable();
    });
}

function simpleUuidRepoFactory(config) {
  return repoFactory({
    name: "simples",
    entityName: "simple",
    ...config,
  });
}

function simpleUuidTableCreator(snakeCase) {
  return (schema) =>
    schema.createTable("simples", (table) => {
      table.uuid("id").defaultTo(knex().raw("uuid_generate_v4()")).primary();
      table.text(snakeCase ? "a_val" : "aVal");
      table
        .timestamp(snakeCase ? "created_at" : "createdAt")
        .defaultTo(knex().fn.now())
        .notNullable();
    });
}

function complexRepoFactory(config) {
  return repoFactory({
    name: "complexes",
    entityName: "complex",
    ...config,
  });
}

function complexTableCreator(snakeCase) {
  return (schema) =>
    schema.createTable("complexes", (table) => {
      table.uuid("id").defaultTo(knex().raw("uuid_generate_v4()")).primary();
      table.uuid("simpleId");
      table.text(snakeCase ? "a_complex_val" : "aComplexVal");
      table
        .timestamp(snakeCase ? "created_at" : "createdAt")
        .defaultTo(knex().fn.now())
        .notNullable();
    });
}

function arraysRepoFactory(config) {
  return repoFactory({
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
        .defaultTo(knex().fn.now())
        .notNullable();
    });
}

function examplesRepoFactory(config) {
  return repoFactory({
    name: "examples",
    entityName: "example",
    ...config,
  });
}

function exampleTableCreator(snakeCase) {
  return (schema) =>
    schema.createTable("examples", (table) => {
      table.uuid("id").defaultTo(knex().raw("uuid_generate_v4()")).primary();
      table.text(snakeCase ? "a_val" : "aVal");
      table.jsonb(snakeCase ? "many_vals" : "manyVals");
      table
        .timestamp(snakeCase ? "created_at" : "createdAt")
        .defaultTo(knex().fn.now())
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
  simpleRepoFactory,
  simpleUuidRepoFactory,
  complexTableCreator,
  complexRepoFactory,
  arraysRepoFactory,
  examplesRepoFactory,
  simpleTableCreator,
  simpleUuidTableCreator,
  arrayTableCreator,
  exampleTableCreator,
  testExtension,
};
