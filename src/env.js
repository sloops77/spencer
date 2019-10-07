const { get: getEnv } = require("env-var");
const log = require("./log");

const nodeEnv = getEnv("NODE_ENV", "development").asString();
const debug = getEnv("DEBUG", ["test", "development"].includes(nodeEnv).toString()).asBool();
const projectName = getEnv("PROJECT_NAME", "spencer-framework").asString();
const dbName = getEnv("DB_NAME", nodeEnv !== "production" ? `${projectName}_${nodeEnv}` : projectName).asString();
const connection = getEnv("DATABASE_URL", `postgresql://postgres@localhost:5432/${dbName}`).asString();
const source = getEnv("NODE_SOURCE", "spencer-node").asString();

const config = {
  nodeEnv,
  debug,
  dbName,
  projectName,
  connection,
  source
};
log.info(config, `Spencer Config`);

module.exports = config;
