/* eslint-disable max-lines */
const _ = require("lodash/fp");
const newError = require("http-errors");
const pSettle = require("p-settle");
const { publish } = require("@spencejs/spence-events");
const initPrepModification = require("./prep-modification");
const { dbifyColumn, apifyColumn } = require("../knex/transformations");

function renderArrayRemoveValue(value) {
  if (_.isPlainObject(value)) {
    return JSON.stringify(value);
  }
  if (_.isString(value)) {
    return `"${value}"`;
  }
  return value;
}

function init(table, extensions = []) {
  const prepModification = initPrepModification(table);
  const queryContext = { transformCase: table.transformCase };

  return _.memoize((context = {}) => {
    function buildFinderQuery({ filter, params = [] }) {
      const query = table(context).queryContext(queryContext);
      if (_.isEmpty(filter)) {
        return query;
      }
      return query.whereRaw(filter, _.castArray(params));
    }

    function findById(id, returning = applied.defaultColumnsSelection) {
      const query = applied.buildFinderQuery({ filter: "id = ?", params: [id] });
      return query.first(returning).delayThen((result) => {
        if (_.isEmpty(result)) {
          throw newError.NotFound(`${table.entityName} ${id} not found`);
        }

        return result;
      });
    }

    function find(
      {
        filter,
        params = [],
        limit,
        offset,
        orderBy = [
          [`${table.tableName}.createdAt`, "desc"],
          [`${table.tableName}.id`, "asc"],
        ],
      } = {},
      returning = applied.defaultColumnsSelection,
    ) {
      let query = applied.buildFinderQuery({ filter, params });
      query = query.select(returning);

      _.forEach(([column, dir]) => {
        query = query.orderBy(column, dir);
      }, orderBy);

      return query.limit(parseInt(limit, 10) || 200).offset(parseInt(offset, 10) || 0);
    }

    function findOne({ filter, params = [], orderBy } = {}, selection = applied.defaultColumnsSelection) {
      const x = applied.find({ filter, params, limit: 1, offset: 0, orderBy }, selection);
      return x.delayThen(_.first);
    }

    function count({ filter, params = [] } = {}) {
      return applied
        .buildFinderQuery({ filter, params })
        .count("id")
        .delayThen((result) => parseInt(_.getOr(0, "[0].count", result), 10));
    }

    function insert(val, returning = applied.defaultColumnsSelection) {
      const resultTransformer = _.first;
      return table(context)
        .queryContext(queryContext)
        .returning(returning)
        .insert(applied.prepModification(val))
        .delayThen(resultTransformer)
        .delayThen((result) => {
          publish(table.entityName, `created`, { state: result, changes: { kind: "new", val } }, context);
          return result;
        });
    }

    function insertMany(vals, selection) {
      return pSettle(_.map((val) => applied.insert(val, selection), vals));
    }

    async function findOrInsert(val, naturalKey, returning = applied.defaultColumnsSelection) {
      const preppedVal = applied.prepModification(val);
      const insertStmt = table(context)
        .insert(_.mapKeys(dbifyColumn(table.transformCase), preppedVal))
        .returning(_.map((column) => `${column} as ${apifyColumn(table.transformCase)(column)}`, returning))
        .toString();
      const insertedVal = await table
        .connection(context)
        .raw(insertStmt.replace(/returning /i, "ON CONFLICT DO NOTHING RETURNING "));
      if (insertedVal != null && insertedVal.rowCount === 1) {
        return _.first(insertedVal.rows);
      }

      return table(context).queryContext(queryContext).where(_.pick(naturalKey, preppedVal)).select(returning).first();
    }

    function doUpdateById(id, updateStatement, returning = applied.defaultColumnsSelection) {
      return applied
        .buildFinderQuery({ filter: "id = ?", params: [id] })
        .returning(returning)
        .update(_.isFunction(updateStatement) ? updateStatement() : updateStatement)
        .delayThen((result) => {
          if (_.isEmpty(result)) {
            throw newError.NotFound(`${table.entityName} ${id} not found`);
          }
          return _.first(result);
        });
    }

    function update(id, val, returning = applied.defaultColumnsSelection) {
      return doUpdateById(id, applied.prepModification(val), returning).delayThen((result) => {
        publish(table.entityName, `updated`, { state: result, changes: { kind: "patch", val } }, context);
        return result;
      });
    }

    async function upsert(id, val, returning = applied.defaultColumnsSelection) {
      const preppedVal = applied.prepModification(val);
      const insertStmt = table().queryContext(queryContext).insert(preppedVal).toString();

      const updateStmt = table()
        .update(_.mapKeys(dbifyColumn(table.transformCase), _.omit(["id"], preppedVal)))
        .whereRaw(`id = ?`, [id])
        .returning(_.map((column) => `${column} as ${apifyColumn(table.transformCase)(column)}`, returning));

      const query = `${insertStmt.toString()} ON CONFLICT (id) DO UPDATE SET ${updateStmt
        .toString()
        .replace(/^update.*set\s/i, "")
        .replace(/(\swhere\s.*)returning/i, " returning")}`;

      return table
        .connection(context)
        .raw(query)
        .then((result) => _.first(result.rows));
    }

    function updateUsingFilter(filter, val, returning = applied.defaultColumnsSelection) {
      const query = applied.buildFinderQuery(filter).returning(returning);
      const updateStatement = applied.prepModification(val);
      return query.update(_.isFunction(updateStatement) ? updateStatement() : updateStatement).delayThen((result) => {
        publish(table.entityName, `updated`, { state: result, changes: { kind: "patch", val } }, context);
        return result;
      });
    }

    function touch(id, returning) {
      return doUpdateById(id, { updatedAt: new Date() }, returning);
    }

    function del(id) {
      const query = applied.buildFinderQuery({ filter: "id = ?", params: [id] });
      return query
        .delete()
        .delayThen((result) => {
          if (result === 0) {
            throw newError.NotFound(`${table.entityName} ${id} not found`);
          }
          return id;
        })
        .delayThen((result) => {
          publish(table.entityName, `deleted`, { id: result }, context);
          return result;
        });
    }

    async function delUsingFilter({ filter, params }) {
      // use find to get the affected id's. This is subject to race coniditions, so consumers must be aware they may receive a deleted message twice
      const affectedIds = _.map("id", await find({ filter, params }, ["id"]));
      const query = applied.buildFinderQuery({ filter, params });
      return query.delete().delayThen(() => {
        _.forEach((id) => publish(table.entityName, `deleted`, { id }, context), affectedIds);
        return affectedIds;
      });
    }

    function addToArray(id, field, val, selection = [field]) {
      return doUpdateById(
        id,
        {
          [field]: table.knex.raw(`?? || ?`, [field, JSON.stringify(val)]),
        },
        selection,
      ).delayThen((result) => {
        publish(
          table.entityName,
          `updated`,
          { state: { id, ...result }, changes: { kind: "add", val: { [field]: _.castArray(val) } } },
          context,
        );
        return result[field];
      });
    }

    function deleteFromArray(id, field, val, selection = [field]) {
      function wrapRemovals(array, inner, idx = 0) {
        if (idx === array.length) {
          return inner;
        }

        return wrapRemovals(array, `array_remove(${inner}, '${renderArrayRemoveValue(array[idx])}')`, idx + 1);
      }
      return doUpdateById(
        id,
        {
          [field]: table.knex.raw(
            `to_jsonb(${wrapRemovals(_.castArray(val), `ARRAY(SELECT jsonb_array_elements(??))`)})`,
            [field],
          ),
        },
        selection,
      ).delayThen((result) => {
        publish(
          table.entityName,
          `updated`,
          { state: { id, ...result }, changes: { kind: "delete", val: { [field]: _.castArray(val) } } },
          context,
        );
        return result[field];
      });
    }

    function addToObject(id, field, val, selection = [field]) {
      if (!_.isPlainObject(val)) {
        throw new Error(`val=${JSON.stringify(val)} is a ${typeof val}. It should be a plain object`);
      }
      return doUpdateById(
        id,
        {
          [field]: table.knex.raw(`?? || ?`, [field, JSON.stringify(val)]),
        },
        selection,
      ).delayThen((result) => {
        publish(
          table.entityName,
          `updated`,
          { state: { id, ...result }, changes: { kind: "add", val: { [field]: _.castArray(val) } } },
          context,
        );
        return result[field];
      });
    }

    function deleteFromObject(id, field, keys, selection = [field]) {
      const typeSuffix = _.isArray(keys) ? "::text[]" : "";
      return doUpdateById(
        id,
        {
          [field]: table.knex.raw(`?? - ?${typeSuffix}`, [field, _.isPlainObject(keys) ? JSON.stringify(keys) : keys]),
        },
        selection,
      ).delayThen((result) => {
        publish(
          table.entityName,
          `updated`,
          { state: { id, ...result }, changes: { kind: "delete", val: { [field]: _.castArray(keys) } } },
          context,
        );
        return result[field];
      });
    }

    const coreRepo = {
      insert,
      insertMany,
      upsert,
      findOrInsert,
      findById,
      find,
      findOne,
      touch,
      update,
      updateUsingFilter,
      del,
      delUsingFilter,
      count,
      addToArray,
      deleteFromArray,
      addToObject,
      deleteFromObject,
      table,
      prepModification,
      buildFinderQuery,
      get defaultColumnsSelection() {
        return table.columnNames;
      },
      extensions: [],
    };

    const applied = _.reduce(
      (acc, fn) => {
        const result = {};
        for (const key of Object.keys(acc)) {
          Object.defineProperty(result, key, Object.getOwnPropertyDescriptor(acc, key));
        }
        const extension = fn(acc, context);
        for (const key of Object.keys(extension)) {
          Object.defineProperty(result, key, Object.getOwnPropertyDescriptor(extension, key));
        }
        return result;
      },
      coreRepo,
      extensions,
    );

    return applied;
  });
}

module.exports = init;
