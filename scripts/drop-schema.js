const { dropSchema } = require("../packages/spence/src/tables/db");
const knex = require("../packages/spence/src/tables");

dropSchema({ softDelete: true })
  .then(() => knex.destroy())
  .then(() => console.info(`schema created`))
  .catch((error) => console.error(error));
