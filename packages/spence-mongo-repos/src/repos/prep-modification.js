const deepCompactObj = require("./deep-compact-obj");

function initPrepModification(collection) {
  return function prepModification(val, kind) {
    const acc = deepCompactObj(val);
    const now = new Date();

    if (kind === "insert") {
      acc[collection.timestampKeys.createdAt] = now;
    }
    if (collection.mutable) {
      acc[collection.timestampKeys.updatedAt] = now;
    }

    return acc;
  };
}

module.exports = initPrepModification;
