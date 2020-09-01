export interface Log {
    debug: Function,
    info: Function,
    warn: Function,
    error: Function,
}

export interface Context {
    log: Log,
    [key: string]: any,
}

export interface Event {
    [key: string]: any
}

export type ErrorHandler = (event: Event, context: Context, error: Error) => void;
