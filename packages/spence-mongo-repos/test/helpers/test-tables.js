const { repoFactory } = require("../../src/repos/repo-registry");
// const mongoClient = require("../../src/mongodb");

function immutableSimpleRepoFactory(config) {
  return repoFactory({
    name: "simples",
    entityName: "simple",
    defaultProjection: {
      _id: 1,
      aVal: 1,
      createdAt: 1,
    },
    mutable: false,
    ...config,
  });
}

function simpleRepoFactory(config) {
  return repoFactory({
    name: "simples",
    entityName: "simple",
    defaultProjection: {
      _id: 1,
      aVal: 1,
      createdAt: 1,
      updatedAt: 1,
    },
    ...config,
  });
}

// function simpleTableCreator(snakeCase) {
//   return (schema) =>
//     schema.createTable("simples", (table) => {
//       table.text("id").primary();
//       table.text(snakeCase ? "a_val" : "aVal");
//       table
//         .timestamp(snakeCase ? "created_at" : "createdAt")
//         .defaultTo(knex.fn.now())
//         .notNullable();
//     });
// }

// function simpleUuidRepoFactory(config) {
//   return repoFactory({
//     name: "simples",
//     entityName: "simple",
//     ...config,
//   });
// }
//
// function simpleUuidTableCreator(snakeCase) {
//   return (schema) =>
//     schema.createTable("simples", (table) => {
//       table.uuid("id").defaultTo(knex.raw("uuid_generate_v4()")).primary();
//       table.text(snakeCase ? "a_val" : "aVal");
//       table
//         .timestamp(snakeCase ? "created_at" : "createdAt")
//         .defaultTo(knex.fn.now())
//         .notNullable();
//     });
// }

function complexRepoFactory(config) {
  return repoFactory({
    name: "complexes",
    entityName: "complex",
    defaultProjection: {
      _id: 1,
      simpleId: 1,
      aComplexVal: 1,
      createdAt: 1,
      updatedAt: 1,
    },
    ...config,
  });
}

// function complexTableCreator(snakeCase) {
//   return (schema) =>
//     schema.createTable("complexes", (table) => {
//       table.uuid("id").defaultTo(knex.raw("uuid_generate_v4()")).primary();
//       table.uuid("simpleId");
//       table.text(snakeCase ? "a_complex_val" : "aComplexVal");
//       table
//         .timestamp(snakeCase ? "created_at" : "createdAt")
//         .defaultTo(knex.fn.now())
//         .notNullable();
//     });
// }

function arraysRepoFactory(config) {
  return repoFactory({
    name: "arrays",
    entityName: "array",
    defaultProjection: {
      _id: 1,
      manyVals: 1,
      createdAt: 1,
      updatedAt: 1,
    },
    ...config,
  });
}

// function arrayTableCreator(snakeCase) {
//   return (schema) =>
//     schema.createTable("arrays", (table) => {
//       table.text("id").primary();
//       table.jsonb(snakeCase ? "many_vals" : "manyVals");
//       table
//         .timestamp(snakeCase ? "created_at" : "createdAt")
//         .defaultTo(knex.fn.now())
//         .notNullable();
//     });
// }

function examplesRepoFactory(config) {
  return repoFactory({
    name: "examples",
    entityName: "example",
    defaultProjection: {
      _id: 1,
      aVal: 1,
      manyVals: 1,
      createdAt: 1,
      updatedAt: 1,
    },
    ...config,
  });
}

// function exampleTableCreator(snakeCase) {
//   return (schema) =>
//     schema.createTable("examples", (table) => {
//       table.uuid("id").defaultTo(knex.raw("uuid_generate_v4()")).primary();
//       table.text(snakeCase ? "a_val" : "aVal");
//       table.jsonb(snakeCase ? "many_vals" : "manyVals");
//       table
//         .timestamp(snakeCase ? "created_at" : "createdAt")
//         .defaultTo(knex.fn.now())
//         .notNullable();
//     });
// }

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
  immutableSimpleRepoFactory,
  simpleRepoFactory,
  // simpleUuidRepoFactory,
  // complexTableCreator,
  complexRepoFactory,
  arraysRepoFactory,
  examplesRepoFactory,
  // simpleTableCreator,
  // simpleUuidTableCreator,
  // arrayTableCreator,
  // exampleTableCreator,
  testExtension,
};
