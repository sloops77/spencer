const { publish, subscribe, setErrorHandler, setLog, disconnect, connect } = require("./events");

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
