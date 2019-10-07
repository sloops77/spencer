const { dropSchema } = require("../src/tables/db");
const knex = require("../src/tables");

dropSchema({ softDelete: true })
  .then(() => knex.destroy())
  .then(() => console.info(`schema created`))
  .catch(error => console.error(error));
