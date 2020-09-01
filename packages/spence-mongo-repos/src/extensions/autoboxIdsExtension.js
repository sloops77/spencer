const _ = require("lodash/fp");
const { ObjectID } = require("mongodb");

const OBJECT_ID_FORMAT = /^[0-9a-fA-F]{24}$/;

const convertId = (id) => (_.isString(id) && OBJECT_ID_FORMAT.test(id) ? new ObjectID(id) : id);

function autoboxIdExtension(parent) {
  return {
    ...parent,
    findById(id, ...rest) {
      return parent.findById(convertId(id), ...rest);
    },
    doUpdateById(id, ...rest) {
      return parent.doUpdateById(convertId(id), ...rest);
    },
    del(id, ...rest) {
      return parent.del(convertId(id), ...rest);
    },
    extensions: parent.extensions.concat(["autoboxIds"]),
  };
}

module.exports = autoboxIdExtension;
