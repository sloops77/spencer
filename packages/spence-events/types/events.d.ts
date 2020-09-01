import {Context, ErrorHandler, Log} from "./types";

export interface Event {
    [key: string]: any
}

/**
 * publishes the event
 * @param {string} topic
 * @param {string} eventName
 * @param {Event} payload
 * @param {Context} context
 * @return {Promise<void>}
 */
export function publish(topic: string, eventName: string, payload: Event, context: Context): Promise<void>;
/**
 * @param {string} topic
 * @param {string} eventName
 * @param {(event: Event) => any | PromiseLike<any>} listener
 */
export function subscribe(topic: string, eventName: string, listener: (event: Event) => any | PromiseLike<any>): void;
/**
 * Disconnects all channels
 * @return void
 */
export function disconnect(): void;
/**
 * Connects the specified channels
 * @param {string[]} channels
 */
export function connect(...channels: string[]): void;
/**
 * @param {ErrorHandler} _errorHandler
 * @return void
 */
export function setErrorHandler(_errorHandler: ErrorHandler): void;
/**
 * @param {Log} _log
 */
export function setLog(_log: Log): void;
/**
 * @param {string[]} contextKeys
 */
export function setSelectedContext(contextKeys: string[]): void;
