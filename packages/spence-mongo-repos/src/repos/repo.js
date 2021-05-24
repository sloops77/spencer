/* eslint-disable max-lines */
const _ = require("lodash/fp");
const newError = require("http-errors");
const { publish } = require("@spencejs/spence-events");
const initPrepModification = require("./prep-modification");

const forEachWithIndex = _.forEach({ cap: false });

function calcPickOmitLists(projection) {
  const initialVal = [[], []];
  return _.reduce(
    (acc, k) => {
      const index = projection[k] === 0 ? 1 : 0;
      acc[index].push(k);
      return acc;
    },
    initialVal,
    _.keys(projection)
  );
}

function init({ collection, extensions = [] }) {
  const prepModification = initPrepModification(collection);

  const prepFilter = (filter) => filter;

  return (context = { log: console }) => {
    function findById(id, projection = applied.defaultColumnsSelection) {
      return applied
        .collection()
        .findOne(applied.prepFilter({ _id: id }), { projection })
        .then(
          // @ts-ignore
          (result) => {
            if (_.isEmpty(result)) {
              throw new newError.NotFound(`${collection.entityName} ${id} not found`);
            }
            return result;
          }
        );
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
        .collection()
        .find(applied.prepFilter(filter), {
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
      projection = applied.defaultColumnsSelection
    ) {
      return applied.collection().findOne(filter, { sort, projection });
    }

    function count({ filter = {} }) {
      return applied.collection().countDocuments(applied.prepFilter(filter));
    }

    function insert(document, projection = applied.defaultColumnsSelection) {
      const [pickList, omitList] = calcPickOmitLists(projection);

      const preppedVal = applied.prepModification(document, "insert");
      return collection()
        .insertOne(preppedVal)
        .then(() => _.flow(_.pick(pickList), _.omit(omitList))(preppedVal))
        .then(
          // @ts-ignore
          (result) => {
            publish(
              collection.entityName,
              `created`,
              { state: result, changes: { kind: "new", val: document } },
              context
            );
            return result;
          }
        );
    }

    async function insertMany(documents, projection = applied.defaultColumnsSelection) {
      const preppedVals = _.map((val) => applied.prepModification(val, "insert"), documents);
      const { insertedIds } = await collection().insertMany(preppedVals);
      if (_.isEmpty(insertedIds)) {
        throw new Error("Multi Insert failed");
      }

      forEachWithIndex(
        (state, i) =>
          publish(collection.entityName, `created`, { state, changes: { kind: "new", val: documents[i] } }, context),
        preppedVals
      );

      const [pickList, omitList] = calcPickOmitLists(projection);
      return _.map(_.flow(_.pick(pickList), _.omit(omitList)), preppedVals);
    }

    async function findOrInsert(document, naturalKey, projection = applied.defaultColumnsSelection) {
      const preppedVal = applied.prepModification(document, "insert");
      const result = await applied
        .collection()
        .findOneAndUpdate(
          applied.prepFilter(_.pick(naturalKey, preppedVal)),
          { $setOnInsert: preppedVal },
          { upsert: true, returnOriginal: false, projection }
        );

      if (_.get("lastErrorObject.upserted", result) != null) {
        publish(
          collection.entityName,
          `created`,
          { state: result.value, changes: { kind: "new", val: document } },
          context
        );
      }

      return result.value;
    }

    function doUpdateById(id, setStatement, projection = applied.defaultColumnsSelection) {
      return applied
        .collection()
        .findOneAndUpdate(
          applied.prepFilter({ _id: id }),
          { $set: _.isFunction(setStatement) ? setStatement() : setStatement },
          {
            returnOriginal: false,
            projection,
          }
        )
        .then(
          // @ts-ignore
          (result) => {
            if (_.isEmpty(result.value)) {
              throw new newError.NotFound(`${collection.entityName} ${id} not found`);
            }
            return result.value;
          }
        );
    }

    function update(id, val, projection = applied.defaultColumnsSelection) {
      return applied.doUpdateById(id, applied.prepModification(val), projection).then(
        // @ts-ignore
        (result) => {
          publish(collection.entityName, `updated`, { state: result, changes: { kind: "patch", val } }, context);
          return result;
        }
      );
    }

    async function upsert(id, val, projection = applied.defaultColumnsSelection) {
      const preppedVal = applied.prepModification(val, "insert");
      const updates = {
        $set: _.omit([collection.timestampKeys.createdAt], preppedVal),
        $setOnInsert: { [collection.timestampKeys.createdAt]: preppedVal[collection.timestampKeys.createdAt] },
      };

      const result = await applied.collection().findOneAndUpdate(applied.prepFilter({ _id: id }), updates, {
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

    async function updateUsingFilter({ filter }, val, projection = applied.defaultColumnsSelection) {
      const affectedIds = _.map("_id", await applied.find({ filter }, { _id: 1 }));
      return (
        applied
          .collection()
          .updateMany(applied.prepFilter(filter), { $set: applied.prepModification(val) })
          .then(() => applied.find({ filter: { _id: { $in: affectedIds } } }, projection))
          // in mongo its not possible to figure return the objects that were updated as the id's of the updated docs are not returned
          .then(
            // @ts-ignore
            (result) => {
              _.forEach(
                (state) =>
                  publish(collection.entityName, `updated`, { state, changes: { kind: "patch", val } }, context),
                result
              );
              return result;
            }
          )
      );
    }

    function touch(id, projection) {
      return applied.doUpdateById(id, { [collection.timestampKeys.updatedAt]: new Date() }, projection);
    }

    function del(id) {
      const filter = applied.prepFilter({ _id: id });
      return applied
        .collection()
        .deleteOne(filter)
        .then(
          // @ts-ignore
          (result) => {
            if (result.deletedCount === 0) {
              throw new newError.NotFound(`${collection.entityName} ${id} not found`);
            }
            return filter._id;
          }
        )
        .then(() => {
          publish(collection.entityName, `deleted`, { id }, context);
          return filter._id;
        });
    }

    async function delUsingFilter({ filter }) {
      // use find to get the affected id's. This is subject to race conditions, so consumers must be aware they may receive a deleted message twice
      const finalFilter = applied.prepFilter(filter);
      const affectedIds = _.map("_id", await applied.find({ filter: finalFilter }, { _id: 1 }));
      return applied
        .collection()
        .deleteMany({ _id: { $in: affectedIds } })
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
      doUpdateById,
      del,
      delUsingFilter,
      count,
      collection,
      prepModification,
      prepFilter,
      defaultColumnsSelection: collection.defaultProjection,
      extensions: [],
    };

    const applied = _.reduce(
      // @ts-ignore
      (acc, fn) => {
        const result = {};
        for (const key of Object.keys(acc)) {
          const propertyDescriptor = Object.getOwnPropertyDescriptor(acc, key);
          if (propertyDescriptor) Object.defineProperty(result, key, propertyDescriptor);
        }
        const extension = fn(acc, context);
        for (const key of Object.keys(extension)) {
          const propertyDescriptor = Object.getOwnPropertyDescriptor(extension, key);
          if (propertyDescriptor) Object.defineProperty(result, key, propertyDescriptor);
        }
        return result;
      },
      coreRepo,
      extensions
    );

    return applied;
  };
}

module.exports = init;
