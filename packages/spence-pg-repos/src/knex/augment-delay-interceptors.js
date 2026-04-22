const QueryBuilder = require("knex/lib/query/querybuilder");
const Raw = require("knex/lib/raw");
const SchemaBuilder = require("knex/lib/schema/builder");

const DELAY_INTERCEPTORS_AUGMENTED = Symbol.for("@spencejs/spence-pg-repos/delay-interceptors-augmented");
const DELAY_INTERCEPTORS = Symbol.for("@spencejs/spence-pg-repos/delay-interceptors");

function definePatchedThen(Target) {
  const originalThen = Target == null || Target.prototype == null ? null : Target.prototype.then;

  if (typeof originalThen !== "function") {
    return;
  }

  Object.defineProperty(Target.prototype, "then", {
    value(...args) {
      const interceptors = (this[DELAY_INTERCEPTORS] || []).slice();

      if (args.length > 0) {
        interceptors.push(["then", args]);
      }

      let result = originalThen.call(this);

      interceptors.forEach((interceptor) => {
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
      this[DELAY_INTERCEPTORS] = this[DELAY_INTERCEPTORS] || [];
      this[DELAY_INTERCEPTORS].push([interceptorName, args]);
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
