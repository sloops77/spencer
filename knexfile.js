module.exports = {
  development: {
    client: "pg",
    connection: {
      database: "spencer-framework_development",
      user: "postgres",
      password: ""
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  },
  test: {
    client: "pg",
    connection: {
      database: "spencer-framework_test",
      user: "postgres",
      password: ""
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  },
  staging: {
    client: "pg",
    connection: {
      database: "spencer-framework_staging",
      user: "postgres",
      password: "12345"
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  },
};
