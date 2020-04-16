const _ = require("lodash/fp");
const EventEmitter = require("events");
const { v1: idGenerator } = require("uuid");
const {
  env: { source },
} = require("@spencejs/spence-core");

const nexus = new EventEmitter();
let connectedChannels = ["*"];

let errorHandler = _.noop;
function setErrorHandler(_errorHandler) {
  errorHandler = _errorHandler;
}

let log = console;
function setLog(_log) {
  log = _log;
}

async function publish(topic, eventName, payload, context) {
  const event = {
    meta: { ...context, id: idGenerator(), topic, eventName, source },
    payload,
  };
  const channel = `${topic}.${eventName}`;
  if (_.isEmpty(_.intersection(connectedChannels, ["*", channel]))) {
    log.info(event, `events channel "${channel}" is disconnected: not publishing event`);
    return;
  }
  try {
    log.debug({ eventId: event.id, meta: _.omit(["tables"], event.meta) }, `publishing event`);
    // doesnt use emit directly because we want to support async callbacks AND to have a general exception handler
    const callbacks = nexus.listeners(channel);
    await Promise.all(_.map((callback) => callback(event), callbacks));
  } catch (error) {
    try {
      errorHandler(event, context, error);
    } catch (nestedError) {
      log.error(nestedError, `Bad error handler has been set using setErrorHandler, it should clean up its own errors`);
    }
  }
}

function logSubscribe(event) {
  return (returnVal) => {
    if (returnVal != null) {
      log.info({ event: _.omit(["meta.tables"], event), returnVal }, `subscribe result log`);
    }
    return returnVal;
  };
}

function subscribe(topic, eventName, listener) {
  nexus.on(`${topic}.${eventName}`, (event) => {
    const returnVal = listener(event);
    if (returnVal == null) {
      return undefined;
    }

    if (returnVal.then != null) {
      return returnVal.then(logSubscribe(event));
    }
    return logSubscribe(event)(returnVal);
  });
}

function disconnect() {
  connectedChannels = [];
}

function connect(...channels) {
  if (_.isEmpty(channels)) {
    connectedChannels = ["*"];
  }
  connectedChannels = connectedChannels.concat(channels);
}

module.exports = { publish, subscribe, disconnect, connect, setErrorHandler, setLog };
