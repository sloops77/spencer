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

export type Binary = 0 | 1;

export interface Projection {
    [key: string]: Binary
}

export interface Document {
    [key: string]: any
}
