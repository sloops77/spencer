const _ = require("lodash/fp");
const { apifyColumn } = require("../knex/transformations");

const mapValuesWithKey = _.mapValues.convert({ cap: false });

function init(table) {
  function detectJsonColumns() {
    const { columnInfo } = table;
    return _.flow(
      _.filter(([, type]) => type === "json" || type === "jsonb"),
      _.map(_.first),
      _.map(apifyColumn(table.transformCase)),
    )(_.toPairs(columnInfo));
  }

  const cachedDetectJsonColumns = _.memoize(detectJsonColumns);

  function prepModification(val) {
    const jsonColumnNames = cachedDetectJsonColumns();
    return mapValuesWithKey((v, k) => (_.includes(k, jsonColumnNames) ? JSON.stringify(v) : v), val);
  }

  return prepModification;
}

module.exports = init;
