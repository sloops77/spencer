const { dropSchema } = require("../packages/spence-tables/src/tables/schemas");
const knex = require("../packages/spence-tables/src/knex");

dropSchema({ softDelete: true })
  .then(() => knex.destroy())
  .then(() => console.info(`schema created`))
  .catch((error) => console.error(error));
