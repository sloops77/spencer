function softDeleteExtension(parent) {
  return {
    async del(id) {
      await parent.table.knex.raw(
        `INSERT INTO ${parent.table.schemaName}_deleted.${parent.table.tableName} SELECT NOW() AS "deletedAt", * FROM ${parent.table.tableName} WHERE id = ?`,
        [id]
      );
      return parent.del(id);
    },
    extensions: parent.extensions.concat(["softDelete"]),
  };
}

module.exports = softDeleteExtension;
