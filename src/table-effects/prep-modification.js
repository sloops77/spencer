const _ = require("lodash/fp");

const mapValuesWithKey = _.mapValues.convert({ cap: false });

function init(table) {
  async function detectJsonColumns() {
    const columnInfo = await table.columnInfo;
    return _.flow(
      _.filter(([, type]) => type === "json" || type === "jsonb"),
      _.map(_.first)
    )(_.toPairs(columnInfo));
  }

  const cachedDetectJsonColumns = _.memoize(detectJsonColumns);

  async function prepModification(val) {
    const jsonColumnNames = await cachedDetectJsonColumns();
    return mapValuesWithKey((v, k) => (_.includes(k, jsonColumnNames) ? JSON.stringify(v) : v), val);
  }

  return prepModification;
}

module.exports = init;
