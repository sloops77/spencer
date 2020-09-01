export interface Log {
    debug: Function,
    info: Function,
    warn: Function,
    error: Function,
}

declare const log: Log;

export default log;
