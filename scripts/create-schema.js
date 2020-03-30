const { createSchema } = require("../packages/spence/src/tables/db");
const knex = require("../packages/spence/src/tables");

createSchema({ softDelete: true })
  .then(() => knex.destroy())
  .then(() => console.info(`schema created`))
  .catch((error) => console.error(error));
