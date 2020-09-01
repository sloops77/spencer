/**
 * @typedef { import("./types").ErrorHandler } ErrorHandler
 * @typedef { import("./types").Log } Log
 */
const { publish, subscribe, setErrorHandler, setLog, disconnect, connect } = require("./events");

/**
 * @param {{errorHandler: ErrorHandler, log: Log}} config
 * @return void
 */
function initEvents({ errorHandler, log }) {
  setErrorHandler(errorHandler);
  setLog(log);
}

const testing = {
  disconnectEvents: disconnect,
  connectEvents: connect,
};

module.exports = {
  subscribe,
  publish,
  initEvents,
  testing,
};
