/* eslint-disable max-lines */
const _ = require("lodash/fp");
const pSettle = require("p-settle");
const { publish } = require("../events/events");
const newError = require("../new-error");
const initPrepModification = require("./prep-modification");

function renderArrayRemoveValue(value) {
  if (_.isPlainObject(value)) {
    return JSON.stringify(value);
  }
  if (_.isString(value)) {
    return `"${value}"`;
  }
  return value;
}

function init(table, extensions = [], transformCase) {
  const prepModification = initPrepModification(table, transformCase);
  const dbifyString = transformCase
    ? (str) => {
        const names = str.split(".");
        if (names.length === 1) {
          return _.snakeCase(str);
        }
        return [...names.slice(0, -1), _.snakeCase(names[names.length - 1])].join(".");
      }
    : _.identity;
  const dbifySelection = transformCase ? _.map(dbifyString) : _.identity;
  const apifyObject = _.mapKeys(_.camelCase);
  const apifyResult = transformCase ? (result) => (result == null ? result : apifyObject(result)) : _.identity;
  const apifyResultArray = transformCase ? _.map(apifyResult) : _.identity;

  return _.memoize((context = {}) => {
    function buildFinderQuery({ filter, params = [] }) {
      const query = table(context);
      if (_.isEmpty(filter)) {
        return query;
      }
      return query.whereRaw(filter, _.castArray(params));
    }

    async function insert(val, selection) {
      const returning = selection || (await applied.defaultColumnsSelection);
      const statement = table(context)
        .returning(returning)
        .insert(await applied.prepModification(val));

      const insertVal = await statement;

      const result = apifyResult(_.first(insertVal));
      publish(table.entityName, `created`, { state: result, changes: { kind: "new", val } }, context);
      return result;
    }

    async function insertMany(vals, selection) {
      return pSettle(_.map((val) => applied.insert(val, selection), vals));
    }

    async function findOrInsert(val, naturalKey, selection) {
      const preppedVal = await applied.prepModification(val);
      const returning = (selection && dbifySelection(selection)) || (await applied.defaultColumnsSelection);
      const dbifiedNaturalKeys = dbifySelection(naturalKey);

      const insertStmt = `${table(context)
        .insert(preppedVal)
        .toString()} ON CONFLICT DO NOTHING RETURNING ${returning.map((v) => `"${v}"`).join(",")}`;
      const insertedVal = await table.connection(context).raw(insertStmt);
      if (insertedVal != null && insertedVal.rowCount === 1) {
        return apifyResult(_.first(insertedVal.rows));
      }

      return table(context).where(_.pick(dbifiedNaturalKeys, preppedVal)).select(returning).first().then(apifyResult);
    }

    async function findById(id, selection) {
      const query = applied.buildFinderQuery({ filter: "id = ?", params: [id] });
      const returning = (selection && dbifySelection(selection)) || (await applied.defaultColumnsSelection);
      const result = await query.first(returning);

      if (_.isEmpty(result)) {
        throw newError(`${table.entityName} ${id} not found`, 404);
      }

      return apifyResult(result);
    }

    async function count({ filter, params = [] }) {
      const result = await applied.buildFinderQuery({ filter, params }).count();
      return parseInt(_.getOr(0, "[0].count", result), 10);
    }

    async function find(
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
      selection,
      decorator = _.identity
    ) {
      let query = applied.buildFinderQuery({ filter, params });
      const returning = (selection && dbifySelection(selection)) || (await applied.defaultColumnsSelection);
      query = query.select(returning);

      _.forEach(([column, dir]) => {
        query = query.orderBy(dbifyString(column), dir);
      }, orderBy);

      return decorator(query)
        .limit(parseInt(limit, 10) || 200)
        .offset(parseInt(offset, 10) || 0)
        .then(apifyResultArray);
    }

    async function findOne({ filter, params = [], orderBy }, selection) {
      const array = await applied.find({ filter, params, limit: 1, offset: 0, orderBy }, selection);
      return _.first(array);
    }

    async function upsert(id, val, selection) {
      const insertStmt = table()
        .insert(await applied.prepModification(val))
        .toString();

      const updateStmt = table()
        .update(_.omit(["id"], await applied.prepModification(val)))
        .whereRaw(`id = ?`, [id]);

      const query = `${insertStmt.toString()} ON CONFLICT (id) DO UPDATE SET ${updateStmt
        .toString()
        .replace(/^update.*set\s/i, "")
        .replace(/\swhere\s.*$/i, "")}`;

      await table.connection(context).raw(query);
      return findById(id, selection);
    }

    async function doUpdateById(id, updateStatement, selection = "id") {
      const query = applied
        .buildFinderQuery({ filter: "id = ?", params: [id] })
        .returning(selection && dbifySelection(selection));

      const result = await query.update(_.isFunction(updateStatement) ? updateStatement() : updateStatement);

      if (_.isEmpty(result)) {
        throw newError(`${table.entityName} ${id} not found`, 404);
      }

      return (selection && apifyResult(_.first(result))) || result;
    }

    async function updateUsingFilter(filter, val, selection) {
      const returning = (selection && dbifySelection(selection)) || (await applied.defaultColumnsSelection);
      const query = applied.buildFinderQuery(filter).returning(returning);
      const updateStatement = await applied.prepModification(val);
      const result = apifyResult(
        await query.update(_.isFunction(updateStatement) ? updateStatement() : updateStatement)
      );

      publish(table.entityName, `updated`, { state: result, changes: { kind: "patch", val } }, context);
      return result;
    }

    async function touch(id, selection) {
      const returning = selection || (await applied.defaultColumnsSelection);
      const result = await doUpdateById(id, { updatedAt: new Date() }, returning);
      return result;
    }

    async function update(id, val, selection) {
      const returning = selection || (await applied.defaultColumnsSelection);
      const result = await doUpdateById(id, await applied.prepModification(val), returning);
      publish(table.entityName, `updated`, { state: result, changes: { kind: "patch", val } }, context);
      return result;
    }

    async function addToArray(id, field, val, selection = [field]) {
      const columnName = dbifyString(field);
      const result = await doUpdateById(
        id,
        {
          [columnName]: table.knex.raw(`?? || ?`, [columnName, JSON.stringify(val)]),
        },
        selection
      );
      publish(
        table.entityName,
        `updated`,
        { state: { id, ...result }, changes: { kind: "add", val: { [field]: _.castArray(val) } } },
        context
      );
      return result[field];
    }

    async function deleteFromArray(id, field, val, selection = [field]) {
      const columnName = dbifyString(field);
      function wrapRemovals(array, inner, idx = 0) {
        if (idx === array.length) {
          return inner;
        }

        return wrapRemovals(array, `array_remove(${inner}, '${renderArrayRemoveValue(array[idx])}')`, idx + 1);
      }
      const result = await doUpdateById(
        id,
        {
          [dbifyString(field)]: table.knex.raw(
            `to_jsonb(${wrapRemovals(_.castArray(val), `ARRAY(SELECT jsonb_array_elements(??))`)})`,
            [columnName]
          ),
        },
        selection
      );
      publish(
        table.entityName,
        `updated`,
        { state: { id, ...result }, changes: { kind: "delete", val: { [field]: _.castArray(val) } } },
        context
      );
      return result[field];
    }

    async function addToObject(id, field, val, selection = [field]) {
      const columnName = dbifyString(field);
      if (!_.isPlainObject(val)) {
        throw new Error(`val=${JSON.stringify(val)} is a ${typeof val}. It should be a plain object`);
      }
      const result = await doUpdateById(
        id,
        {
          [columnName]: table.knex.raw(`?? || ?`, [columnName, JSON.stringify(val)]),
        },
        selection
      );
      publish(
        table.entityName,
        `updated`,
        { state: { id, ...result }, changes: { kind: "add", val: { [field]: _.castArray(val) } } },
        context
      );
      return result[field];
    }

    async function deleteFromObject(id, field, keys, selection = [field]) {
      const columnName = dbifyString(field);
      const typeSuffix = _.isArray(keys) ? "::text[]" : "";
      const result = await doUpdateById(
        id,
        {
          [columnName]: table.knex.raw(`?? - ?${typeSuffix}`, [
            columnName,
            _.isPlainObject(keys) ? JSON.stringify(keys) : keys,
          ]),
        },
        selection
      );
      publish(
        table.entityName,
        `updated`,
        { state: { id, ...result }, changes: { kind: "delete", val: { [field]: _.castArray(keys) } } },
        context
      );
      return result[field];
    }

    async function del(id) {
      const query = applied.buildFinderQuery({ filter: "id = ?", params: [id] });
      return query.delete().then((result) => {
        if (result === 0) {
          throw newError(`${table.entityName} ${id} not found`, 404);
        }

        publish(table.entityName, `deleted`, { id }, context);
        return id;
      });
    }

    async function delUsingFilter({ filter, params }) {
      // use find to get the affected id's. This is subject to race coniditions, so consumers must be aware they may receive a deleted message twice
      const affectedIds = _.map("id", await find({ filter, params }, ["id"]));
      const query = applied.buildFinderQuery({ filter, params });
      return query.delete().then(() => {
        _.forEach((id) => publish(table.entityName, `deleted`, { id }, context), affectedIds);
        return affectedIds;
      });
    }

    const coreTableEffects = {
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
      (acc, fn) => ({ ...acc, ...fn({ doUpdateById, ...acc }, context) }),
      coreTableEffects,
      extensions
    );

    return applied;
  });
}

module.exports = init;
