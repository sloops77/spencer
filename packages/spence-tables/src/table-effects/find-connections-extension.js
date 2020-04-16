function findConnectionsExtension(parent) {
  return {
    findOneByConnection({ kind, id }, selection) {
      return parent.findOne({ filter: `connections @> '[${JSON.stringify({ kind, id: id || "" })}]'` }, selection);
    },
    extensions: parent.extensions.concat(["finders"]),
  };
}

module.exports = findConnectionsExtension;
