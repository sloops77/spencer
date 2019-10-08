const { get: getEnv } = require("env-var");
const importCwd = require("import-cwd");

const log = require("./log");
const spenceConfig = importCwd.silent("./spencerc") || {};

const nodeEnv = getEnv("NODE_ENV", "development").asString();
const debug = getEnv("DEBUG", ["test", "development"].includes(nodeEnv).toString()).asBool();
const dbNamePrefix = getEnv("DB_NAME_PREFIX", spenceConfig.dbNamePrefix || "spencer-framework").asString();
const dbName = getEnv("DB_NAME", nodeEnv !== "production" ? `${dbNamePrefix}_${nodeEnv}` : dbNamePrefix).asString();
const connection = getEnv("DATABASE_URL", `postgresql://postgres@localhost:5432/${dbName}`).asString();
const source = getEnv("NODE_SOURCE", "spencer-node").asString();

const config = {
  nodeEnv,
  debug,
  dbName,
  dbNamePrefix,
  connection,
  source
};
log.info(config, `Spencer Config`);

module.exports = config;
