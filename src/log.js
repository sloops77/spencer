const pino = require("pino");
const { get: getEnv } = require("env-var");
const importCwd = require("import-cwd");

const spenceConfig = importCwd.silent("./spencerc") || {};

const nodeEnv = getEnv("NODE_ENV").default("development").asString();
const debug = getEnv("DEBUG").default(["test", "development"].includes(nodeEnv).toString()).asBool();
const prettyPrint = debug ? { colorize: true, translateTime: true, ignore: "hostname,pid" } : false;

const log = pino({
  level: debug ? "debug" : "info",
  prettyPrint,
  ...spenceConfig.logger,
});
module.exports = log;
