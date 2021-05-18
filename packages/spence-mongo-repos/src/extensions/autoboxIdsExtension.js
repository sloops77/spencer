const _ = require("lodash/fp");
const { ObjectID } = require("mongodb");

const OBJECT_ID_FORMAT = /^[0-9a-fA-F]{24}$/;

const convertId = (id) => (_.isString(id) && OBJECT_ID_FORMAT.test(id) ? new ObjectID(id) : id);

function autoboxIdExtension(parent) {
  return {
    ...parent,
    prepFilter(filter) {
      if (filter == null || filter._id == null) {
        return filter;
      }
      if (Array.isArray(filter._id.$in)) {
        // eslint-disable-next-line no-param-reassign
        filter._id.$in = _.map(convertId, filter._id.$in);
        return filter;
      }

      // eslint-disable-next-line no-param-reassign
      filter._id = convertId(filter._id);
      return filter;
    },
    extensions: parent.extensions.concat(["autoboxIds"]),
  };
}

module.exports = autoboxIdExtension;
