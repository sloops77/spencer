const deepCompactObj = require("./deep-compact-obj");

/**
 * @typedef { import("../types").Collection } Collection
 * @typedef { import("../types").KindOfModification } KindOfModification
 * @typedef { import("../types").Document } Document
 */

/**
 * @type {(collection: Collection) => (val: Document, kind: KindOfModification) => Document}
 */
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
