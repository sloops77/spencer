/* eslint-disable global-require */
const env = require("./env");
const log = require("./log");

log.info(env, `Spencer Config`);

module.exports = {
  log,
  env,
};
