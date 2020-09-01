const _ = require("lodash/fp");

// @ts-ignore
function reducer(val) {
  if (_.isArray(val)) {
    return _.map(reducer, val);
  }
  if (!_.isPlainObject(val)) {
    return val;
  }
  return deepCompactObj(val);
}

/**
 * Compacts the complete object graph
 * @param {{[name: string]: any}} obj
 * @return {{[name: string]: any}}
 */
const deepCompactObj = (obj) => {
  /** @type {{[name: string]: any}} */
  const initialValue = {};
  return _.reduce(
    (acc, k) => {
      if (obj[k] == null) {
        return acc;
      }

      acc[k] = reducer(obj[k]);
      return acc;
    },
    initialValue,
    _.keys(obj)
  );
};

module.exports = deepCompactObj;
