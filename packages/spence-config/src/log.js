/**
 * @typedef { import("./types").Log } Log
 */

const pino = require("pino");
const importCwd = require("import-cwd");

const { debug } = require("./env");

/** @type {{logger?: {[key: string]: any}}} */
// @ts-ignore
const spenceConfig = importCwd.silent("./spencerc") || {};

const prettyPrint = debug ? { colorize: true, translateTime: true, ignore: "hostname,pid" } : false;

/** @type {Log} */
const log = pino({
  level: debug ? "debug" : "info",
  prettyPrint,
  ...spenceConfig.logger,
});
module.exports = log;
