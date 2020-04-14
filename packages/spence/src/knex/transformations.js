const _ = require("lodash/fp");

const apifyColumn = _.memoize((transformCase) => (transformCase ? _.camelCase : _.identity));
const apifyKeys = (result) => (result == null ? result : _.mapKeys(_.camelCase, result));
const apifyResult = _.memoize((transformCase) => (transformCase ? apifyKeys : _.identity));
const apifyResultArray = _.memoize((transformCase) => (transformCase ? _.map(apifyResult(transformCase)) : _.identity));
const dbifyColumn = _.memoize((transformCase) =>
  transformCase
    ? (str) => {
        const names = str.split(".");
        if (names.length === 1) {
          return _.snakeCase(str);
        }
        return [...names.slice(0, -1), _.snakeCase(names[names.length - 1])].join(".");
      }
    : _.identity
);

module.exports = { apifyColumn, apifyResult, apifyResultArray, dbifyColumn };
