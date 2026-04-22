const QueryBuilder = require("knex/lib/query/querybuilder");
const Raw = require("knex/lib/raw");
const SchemaBuilder = require("knex/lib/schema/builder");
const DeferredResult = require("./deferred-result");

const DEFER_RESULT_AUGMENTED = Symbol.for("@spencejs/spence-pg-repos/defer-result-augmented");

function defineDeferResult(Target) {
  if (typeof Target.prototype.deferResult === "function") {
    return;
  }

  Object.defineProperty(Target.prototype, "deferResult", {
    value() {
      return new DeferredResult({ builder: this, basePromise: null });
    },
    configurable: true,
    writable: true,
  });
}

function augmentDeferredResult(Target) {
  if (Target == null || Target.prototype == null || Target.prototype[DEFER_RESULT_AUGMENTED]) {
    return;
  }

  defineDeferResult(Target);

  Object.defineProperty(Target.prototype, DEFER_RESULT_AUGMENTED, {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });
}

function applyKnexDeferredResults() {
  [QueryBuilder, Raw, SchemaBuilder].forEach(augmentDeferredResult);
}

module.exports = {
  applyKnexDeferredResults,
};
