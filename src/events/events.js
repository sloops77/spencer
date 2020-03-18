const _ = require("lodash/fp");
const EventEmitter = require("events");
const idGenerator = require("uuid/v1");
const { source } = require("../env");

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
    meta: { id: idGenerator(), topic, eventName, source, ...context },
    payload
  };
  const channel = `${topic}.${eventName}`;
  if (_.isEmpty(_.intersection(connectedChannels, ["*", channel]))) {
    log.info(event, `events channel "${channel}" is disconnected: not publishing event`);
    return;
  }
  try {
    log.debug({ eventId: event.id, meta: event.meta }, `publishing event`);
    // doesnt use emit directly because we want to support async callbacks AND to have a general exception handler
    const callbacks = nexus.listeners(channel);
    await Promise.all(_.map(callback => callback(event), callbacks));
  } catch (error) {
    try {
      errorHandler(event, context, error);
    } catch (nestedError) {
      log.error(nestedError, `Bad error handler has been set using setErrorHandler, it should clean up its own errors`);
    }
  }
}

function logSubscribe(event) {
  return returnVal => {
    if (!_.isEmpty(returnVal)) {
      log.info({ event, returnVal }, `subscribe result log`);
    }
    return returnVal;
  };
}

function subscribe(topic, eventName, listener) {
  nexus.on(`${topic}.${eventName}`, event => {
    const returnVal = listener(event);
    if (returnVal.then) {
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