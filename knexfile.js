module.exports = {
  development: {
    client: "pg",
    connection: {
      database: "spence_development",
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
      database: "spence_test",
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
      database: "spence_staging",
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
