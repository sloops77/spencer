const { dropSchema } = require("../packages/spence-pg-repos/src/tables/schemas");
const knex = require("../packages/spence-pg-repos/src/knex");

dropSchema({ softDelete: true })
  .then(() => knex.destroy())
  .then(() => console.info(`schema created`))
  .catch((error) => console.error(error));
