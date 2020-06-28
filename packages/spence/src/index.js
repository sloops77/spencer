/* eslint-disable global-require */
module.exports = {
  ...require("@spencejs/spence-api"),
  ...require("@spencejs/spence-events"),
  ...require("@spencejs/spence-pg-repos"),
  ...require("@spencejs/spence-mongo-repos"),
};
