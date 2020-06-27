const error = require("./schemas/error");

function responseSchemaBuilder(success, { notFound = true, authenticated = true } = {}) {
  const kinds = { ...success, 400: error, 500: error };
  if (notFound) {
    kinds[404] = error;
  }
  if (authenticated) {
    kinds[401] = error;
    kinds[403] = error;
  }
  return kinds;
}

module.exports = responseSchemaBuilder;
