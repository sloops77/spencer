const { createSchema } = require("../packages/spence-repos/src/tables/schemas");
const knex = require("../packages/spence-repos/src/knex");

createSchema({ softDelete: true })
  .then(() => knex.destroy())
  .then(() => console.info(`schema created`))
  .catch((error) => console.error(error));
