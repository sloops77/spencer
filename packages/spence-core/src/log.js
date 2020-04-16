const pino = require("pino");
const importCwd = require("import-cwd");

const { debug } = require("./env");

const spenceConfig = importCwd.silent("./spencerc") || {};

const prettyPrint = debug ? { colorize: true, translateTime: true, ignore: "hostname,pid" } : false;

const log = pino({
  level: debug ? "debug" : "info",
  prettyPrint,
  ...spenceConfig.logger,
});
module.exports = log;
