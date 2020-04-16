const { publish, subscribe, setErrorHandler, setLog, disconnect, connect } = require("./events");

module.exports = {
  subscribe,
  publish,
  initEvents({ errorHandler, log }) {
    setErrorHandler(errorHandler);
    setLog(log);
  },
  testing: {
    disconnectEvents: disconnect,
    connectEvents: connect,
  },
};
