/* eslint-disable max-lines */
const _ = require("lodash/fp");
const newError = require("http-errors");
const { publish } = require("@spencejs/spence-events");
const initPrepModification = require("./prep-modification");

const forEachWithIndex = _.forEach({ cap: false });

function calcPickOmitLists(projection) {
  return _.reduce(
    (acc, k) => {
      const index = projection[k] === 0 ? 1 : 0;
      acc[index].push(k);
      return acc;
    },
    [[], []],
    _.keys(projection)
  );
}

function init({ collection, extensions = [] }) {
  const prepModification = initPrepModification(collection);

  return _.memoize((context = {}) => {
    function buildFinderQuery(filter, findMethodName = "find") {
      const collectionObj = collection(context);
      return _.partial(collectionObj[findMethodName].bind(collectionObj), [filter]);
    }

    function findById(id, returning = applied.defaultColumnsSelection) {
      return applied
        .buildFinderQuery(
          { _id: id },
          "findOne"
        )({ projections: returning })
        .then((result) => {
          if (_.isEmpty(result)) {
            throw newError.NotFound(`${collection.entityName} ${id} not found`);
          }
          return result;
        });
    }

    function find(
      {
        filter = {},
        limit = 200,
        offset = 0,
        skip,
        orderBy = [
          [collection.timestampKeys.createdAt, -1],
          [`_id`, 1],
        ],
        sort,
        ...otherOptions
      } = {},
      projection = applied.defaultColumnsSelection
    ) {
      return applied
        .buildFinderQuery(filter)({
          limit,
          skip: skip || offset,
          sort: sort || orderBy,
          projection,
          ...otherOptions,
        })
        .toArray();
    }

    function findOne(
      {
        filter = {},
        sort = [
          [collection.timestampKeys.createdAt, -1],
          [`_id`, 1],
        ],
      } = {},
      selection = applied.defaultColumnsSelection
    ) {
      return applied.buildFinderQuery(filter, "findOne")({ sort, projection: selection });
    }

    function count(filter = {}) {
      return applied.buildFinderQuery(filter, "count")();
    }

    function insert(val, projection = applied.defaultColumnsSelection) {
      const [pickList, omitList] = calcPickOmitLists(projection);

      const preppedVal = applied.prepModification(val, "insert");
      return collection(context)
        .insertOne(preppedVal)
        .then(() => _.flow(_.pick(pickList), _.omit(omitList))(preppedVal))
        .then((result) => {
          publish(collection.entityName, `created`, { state: result, changes: { kind: "new", val } }, context);
          return result;
        });
    }

    async function insertMany(vals, projection = applied.defaultColumnsSelection) {
      const preppedVals = _.map((val) => applied.prepModification(val, "insert"), vals);
      const { insertedIds } = await collection(context).insertMany(preppedVals);
      if (_.isEmpty(insertedIds)) {
        throw new Error("Multi Insert failed");
      }

      forEachWithIndex(
        (state, i) =>
          publish(collection.entityName, `created`, { state, changes: { kind: "new", val: vals[i] } }, context),
        preppedVals
      );

      const [pickList, omitList] = calcPickOmitLists(projection);
      return _.map(_.flow(_.pick(pickList), _.omit(omitList)), preppedVals);
    }

    async function findOrInsert(val, naturalKey, projection = applied.defaultColumnsSelection) {
      const preppedVal = applied.prepModification(val, "insert");
      const result = await applied.buildFinderQuery(_.pick(naturalKey, preppedVal), "findOneAndUpdate")(
        { $setOnInsert: preppedVal },
        { upsert: true, returnOriginal: false, projection }
      );

      if (_.get("lastErrorObject.upserted", result) != null) {
        publish(collection.entityName, `created`, { state: result.value, changes: { kind: "new", val } }, context);
      }

      return result.value;
    }

    function doUpdateById(id, updateStatement, projection = applied.defaultColumnsSelection) {
      return applied
        .buildFinderQuery({ _id: id }, "findOneAndUpdate")(
          { $set: _.isFunction(updateStatement) ? updateStatement() : updateStatement },
          {
            returnOriginal: false,
            projection,
          }
        )
        .then((result) => {
          if (_.isEmpty(result.value)) {
            throw newError.NotFound(`${collection.entityName} ${id} not found`);
          }
          return result.value;
        });
    }

    function update(id, val, projection = applied.defaultColumnsSelection) {
      return doUpdateById(id, applied.prepModification(val), projection).then((result) => {
        publish(collection.entityName, `updated`, { state: result, changes: { kind: "patch", val } }, context);
        return result;
      });
    }

    async function upsert(id, val, projection = applied.defaultColumnsSelection) {
      const preppedVal = applied.prepModification(val, "insert");
      const updates = {
        $set: _.omit([collection.timestampKeys.createdAt], preppedVal),
        $setOnInsert: { [collection.timestampKeys.createdAt]: preppedVal[collection.timestampKeys.createdAt] },
      };

      const result = await applied.buildFinderQuery({ _id: id }, "findOneAndUpdate")(updates, {
        upsert: true,
        returnOriginal: false,
        projection,
      });

      if (_.get("lastErrorObject.upserted", result) != null) {
        publish(collection.entityName, `created`, { state: result.value, changes: { kind: "new", val } }, context);
      } else {
        publish(collection.entityName, `updated`, { state: result.value, changes: { kind: "new", val } }, context);
      }

      return result.value;
    }

    async function updateUsingFilter(filter, val, projection = applied.defaultColumnsSelection) {
      const affectedIds = _.map("_id", await applied.find({ filter }, { _id: 1 }));
      return (
        applied
          .buildFinderQuery(
            filter,
            "updateMany"
          )({ $set: applied.prepModification(val) })
          .then(() => applied.find({ filter: { _id: { $in: affectedIds } } }, projection))
          // in mongo its not possible to figure return the objects that were updated as the id's of the updated docs are not returned
          .then((result) => {
            _.forEach(
              (state) => publish(collection.entityName, `updated`, { state, changes: { kind: "patch", val } }, context),
              result
            );
            return result;
          })
      );
    }

    function touch(id, returning) {
      return doUpdateById(id, { [collection.timestampKeys.updatedAt]: new Date() }, returning);
    }

    function del(id) {
      return applied
        .buildFinderQuery({ _id: id }, "deleteOne")()
        .then((result) => {
          if (result.deletedCount === 0) {
            throw newError.NotFound(`${collection.entityName} ${id} not found`);
          }
          return id;
        })
        .then((result) => {
          publish(collection.entityName, `deleted`, { id: result }, context);
          return result;
        });
    }

    async function delUsingFilter(filter) {
      // use find to get the affected id's. This is subject to race coniditions, so consumers must be aware they may receive a deleted message twice
      const affectedIds = _.map("_id", await applied.find({ filter }, { _id: 1 }));
      return applied
        .buildFinderQuery(filter, "deleteMany")()
        .then(() => {
          _.forEach((id) => publish(collection.entityName, `deleted`, { id }, context), affectedIds);
          return affectedIds;
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
      buildFinderQuery,
      collection,
      prepModification,
      get defaultColumnsSelection() {
        return collection.defaultProjection;
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
      extensions
    );

    return applied;
  });
}

module.exports = init;
