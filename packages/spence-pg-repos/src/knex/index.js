require("./augment-deferred-result").applyKnexDeferredResults();

module.exports = { ...require("./knex-factory"), knexPlugin: require("./knex-plugin") };
