const _ = require("lodash/fp");

const mapValuesWithKey = _.mapValues.convert({ cap: false });
const dbifyObject = _.mapKeys(_.snakeCase); // could use _.noop as well. Performance test?

function init(table, transformCase) {
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
    const dbifiedVal = transformCase ? dbifyObject(val) : val;
    return mapValuesWithKey((v, k) => (_.includes(k, jsonColumnNames) ? JSON.stringify(v) : v), dbifiedVal);
  }

  return prepModification;
}

module.exports = init;
