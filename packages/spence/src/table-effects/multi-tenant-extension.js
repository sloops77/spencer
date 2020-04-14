const _ = require("lodash/fp");

function multiTenantExtension(parent, { tenant }) {
  const baseExtension = {
    get defaultColumnsSelection() {
      return _.pull("tenant", parent.defaultColumnsSelection);
    },
    extensions: parent.extensions.concat(["multiTenant"]),
  };

  if (!tenant) {
    return baseExtension;
  }

  return {
    ...baseExtension,
    insert(val, ...args) {
      return parent.insert({ tenant, ...val }, ...args);
    },
    buildFinderQuery(...args) {
      const query = parent.buildFinderQuery(...args);
      return query.where({ tenant });
    },
  };
}

module.exports = multiTenantExtension;
