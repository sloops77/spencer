/* eslint-disable no-underscore-dangle */
const QueryBuilder = require("knex/lib/query/querybuilder");
const Raw = require("knex/lib/raw");
const SchemaBuilder = require("knex/lib/schema/builder");

const DELAY_INTERCEPTORS_AUGMENTED = Symbol.for("@spencejs/spence-pg-repos/delay-interceptors-augmented");

function definePatchedThen(Target) {
  Object.defineProperty(Target.prototype, "then", {
    value(...args) {
      this._interceptors = this._interceptors || [];
      this._interceptors.push(["then", args]);

      let result = this.client.runner(this).run();

      if (this.client.config.asyncStackTraces) {
        result = result.catch((err) => {
          const errorWithOriginalStack = err;
          errorWithOriginalStack.originalStack = errorWithOriginalStack.stack;
          const firstLine = errorWithOriginalStack.stack.split("\n")[0];
          const { error, lines } = this._asyncStack;
          const stackByLines = error.stack.split("\n");
          const asyncStack = stackByLines.slice(lines);
          asyncStack.unshift(firstLine);
          errorWithOriginalStack.stack = asyncStack.join("\n");
          throw errorWithOriginalStack;
        });
      }

      this._interceptors.forEach((interceptor) => {
        result = result[interceptor[0]](...interceptor[1]);
      });

      return result;
    },
    configurable: true,
    writable: true,
  });
}

function defineDelayMethod(Target, methodName, interceptorName) {
  if (typeof Target.prototype[methodName] === "function") {
    return;
  }

  Object.defineProperty(Target.prototype, methodName, {
    value(...args) {
      this._interceptors = this._interceptors || [];
      this._interceptors.push([interceptorName, args]);
      return this;
    },
    configurable: true,
    writable: true,
  });
}

function augmentDelayInterceptors(Target) {
  if (Target == null || Target.prototype == null || Target.prototype[DELAY_INTERCEPTORS_AUGMENTED]) {
    return;
  }

  definePatchedThen(Target);
  defineDelayMethod(Target, "delayThen", "then");
  defineDelayMethod(Target, "delayCatch", "catch");

  Object.defineProperty(Target.prototype, DELAY_INTERCEPTORS_AUGMENTED, {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });
}

function applyKnexDelayInterceptors() {
  [QueryBuilder, Raw, SchemaBuilder].forEach(augmentDelayInterceptors);
}

module.exports = {
  applyKnexDelayInterceptors,
};
