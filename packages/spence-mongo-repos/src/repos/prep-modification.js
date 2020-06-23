const _ = require("lodash/fp");

const deepCompactObj = (initialAcc, obj) =>
  _.reduce(
    (acc, k) => {
      if (obj[k] == null) {
        return acc;
      }
      if (!_.isPlainObject(obj[k])) {
        acc[k] = obj[k];
        return acc;
      }
      return deepCompactObj({}, obj[k]);
    },
    initialAcc,
    _.keys(obj)
  );

function initPrepModification(collection) {
  return function prepModification(val, kind) {
    const initialAcc = {};
    const now = new Date();

    if (kind === "insert") {
      initialAcc[collection.timestampKeys.createdAt] = now;
    }
    if (collection.mutable) {
      initialAcc[collection.timestampKeys.updatedAt] = now;
    }

    return deepCompactObj(initialAcc, val);
  };
}

module.exports = initPrepModification;
