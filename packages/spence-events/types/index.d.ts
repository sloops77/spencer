import {ErrorHandler, Log} from "./types";

import {disconnect, connect, publish, subscribe} from "./events";


export { publish, subscribe }

export function initEvents({ errorHandler, log }: {
    errorHandler: ErrorHandler;
    log: Log;
}): void;

export namespace testing {
    export { disconnect as disconnectEvents };
    export { connect as connectEvents };
}
