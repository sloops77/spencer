const _ = require("lodash/fp");
const { EventEmitter } = require("events");
const { v1: idGenerator } = require("uuid");

/**
 * @typedef { import("./types").Context } Context
 * @typedef { import("./types").Log } Log
 * @typedef { import("./types").Event } Event
 * @typedef { import("./types").ErrorHandler } ErrorHandler
 */

const nexus = new EventEmitter();
let connectedChannels = ["*"];

let errorHandler = _.noop;

/**
 * @param {ErrorHandler} _errorHandler
 * @return void
 */
function setErrorHandler(_errorHandler) {
  errorHandler = _errorHandler;
}

/** @type {Log} */
let log = console;

/**
 * @param {Log} _log
 */
function setLog(_log) {
  log = _log;
}

let selectedContext = _.pick(["source", "tenant", "user", "userId"]);

/**
 * @param {string[]} contextKeys
 */
function setSelectedContext(contextKeys) {
  selectedContext = _.pick(contextKeys);
}

/**
 * publishes the event
 * @param {string} topic
 * @param {string} eventName
 * @param {Event} payload
 * @param {Context} context
 * @return {Promise<void>}
 */
async function publish(topic, eventName, payload, context) {
  const event = {
    meta: { ...selectedContext(context), id: idGenerator(), topic, eventName },
    payload,
  };
  const channel = `${topic}.${eventName}`;
  if (_.isEmpty(_.intersection(connectedChannels, ["*", channel]))) {
    log.info(event, `events channel "${channel}" is disconnected: not publishing event`);
    return;
  }
  try {
    log.debug({ meta: _.omit(["tables"], event.meta) }, `publishing event`);
    // doesnt use emit directly because we want to support async callbacks AND to have a general exception handler
    const callbacks = nexus.listeners(channel);
    await Promise.all(_.map((callback) => callback(event), callbacks));
  } catch (error) {
    try {
      errorHandler(event, selectedContext(context), error);
    } catch (nestedError) {
      log.error(nestedError, `Bad error handler has been set using setErrorHandler, it should clean up its own errors`);
    }
  }
}

/**
 * @template T
 * @param {Event} event
 * @return {(returnVal: T) => T}
 */
function logSubscribe(event) {
  return (returnVal) => {
    if (returnVal != null) {
      log.info({ event: _.omit(["meta.tables"], event), returnVal }, `subscribe result log`);
    }
    return returnVal;
  };
}

/**
 * @param {string} topic
 * @param {string} eventName
 * @param {(event: Event) => any | PromiseLike<any>} listener
 */
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

/**
 * Disconnects all channels
 * @return void
 */
function disconnect() {
  connectedChannels = [];
}

/**
 * Connects the specified channels
 * @param {string[]} channels
 */
function connect(...channels) {
  if (_.isEmpty(channels)) {
    connectedChannels = ["*"];
  }
  connectedChannels = connectedChannels.concat(channels);
}

module.exports = { publish, subscribe, disconnect, connect, setErrorHandler, setLog, setSelectedContext };
