const _ = require("lodash/fp");

function reducer(val) {
  if (_.isArray(val)) {
    return _.map(reducer, val);
  }
  if (!_.isPlainObject(val)) {
    return val;
  }
  return deepCompactObj(val);
}

const deepCompactObj = (obj) => {
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
    _.keys(obj),
  );
};

module.exports = deepCompactObj;
