/* eslint-disable max-lines */
const _ = require("lodash/fp");
const newError = require("http-errors");
const { publish } = require("@spencejs/spence-events");
const initPrepModification = require("./prep-modification");

/**
 * @template T
 * @type {function ((val: T, i: number) => void, T[]): void}
 */
// @ts-ignore
const forEachWithIndex = _.forEach({ cap: false });

/**
 * @typedef { import("mongodb").ObjectID } ObjectID
 * @typedef { import("../types").Collection } Collection
 * @typedef { import("../types").Projection } Projection
 * @typedef { import("../types").Query } Query
 * @typedef { import("../types").Document } Document
 * @typedef { import("../types").Context } Context
 * @typedef { import("../types").Repo } Repo
 */

/**
 * @param {Projection} projection
 * @returns {[string[],string[]]}
 */
function calcPickOmitLists(projection) {
  /** @type {[string[],string[]]} */
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

/**
 * @param {{collection: Collection, extensions: any[]}} config
 * @returns {Repo}
 */
function init({ collection, extensions = [] }) {
  const prepModification = initPrepModification(collection);

  return _.memoize(
    /** @type {Repo} */
    (context = { log: console }) => {
      /**
       * Finds a single document by id
       * @param {string|ObjectID} id
       * @param {Projection} projection
       * @returns {Promise<Document>}
       */
      function findById(id, projection = applied.defaultColumnsSelection) {
        return applied
          .collection()
          .findOne({ _id: id }, { projection })
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

      /**
       * Finds a list of documents by using a query
       * @param {Query} query
       * @param {Projection} projection
       * @returns {Promise<Document[]>}
       */
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
        return applied.collection
          .find(filter, {
            limit,
            skip: skip || offset,
            sort: sort || orderBy,
            projection,
            ...otherOptions,
          })
          .toArray();
      }

      /**
       * Finds a single document by using a query
       * @param {Query} query
       * @param {Projection} projection
       * @returns {Promise<Document | null>}
       */
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

      /**
       * Counts the documents by using a query
       * @param {Query} query
       * @returns {Promise<number>}
       */
      function count({ filter = {} }) {
        return applied.collection().count(filter)();
      }

      /**
       * Inserts a document into the collection
       * @param {Document} document
       * @param {Projection} projection
       * @returns {Promise<Document>}
       */
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

      /**
       * Inserts documents into the collection
       * @param {Document[]} documents
       * @param {Projection} projection
       * @returns {Promise<Document[]>}
       */
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

      /**
       * Finds a document by the natural key values in the passed document. If not found, then the document is inserted.
       * @param {Document} document
       * @param {string[]} naturalKey
       * @param {Projection} projection
       * @returns {Promise<Document>}
       */
      async function findOrInsert(document, naturalKey, projection = applied.defaultColumnsSelection) {
        const preppedVal = applied.prepModification(document, "insert");
        const result = await applied
          .collection()
          .findOneAndUpdate(
            _.pick(naturalKey, preppedVal),
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

      /**
       * Does an update by id
       * @param {string|ObjectID} id
       * @param {Document | (() => Document)} setStatement
       * @param {Projection} projection
       * @returns {Promise<Document>}
       */
      function doUpdateById(id, setStatement, projection = applied.defaultColumnsSelection) {
        return applied
          .collection()
          .findOneAndUpdate(
            { _id: id },
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

      /**
       * Does an update by id
       * @param {string|ObjectID} id
       * @param {Document} val
       * @param {Projection} projection
       * @returns {Promise<Document>}
       */
      function update(id, val, projection = applied.defaultColumnsSelection) {
        return applied.doUpdateById(id, applied.prepModification(val), projection).then(
          // @ts-ignore
          (result) => {
            publish(collection.entityName, `updated`, { state: result, changes: { kind: "patch", val } }, context);
            return result;
          }
        );
      }

      /**
       * Upserts the value
       * @param {string|ObjectID} id
       * @param {Document} val
       * @param {Projection} projection
       * @returns {Promise<Document>}
       */
      async function upsert(id, val, projection = applied.defaultColumnsSelection) {
        const preppedVal = applied.prepModification(val, "insert");
        const updates = {
          $set: _.omit([collection.timestampKeys.createdAt], preppedVal),
          $setOnInsert: { [collection.timestampKeys.createdAt]: preppedVal[collection.timestampKeys.createdAt] },
        };

        const result = await applied.collection().findOneAndUpdate({ _id: id }, updates, {
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

      /**
       * Does an update by filter
       * @param {Query} query
       * @param {Document} val
       * @param {Projection} projection
       * @returns {Promise<Document[]>}
       */
      async function updateUsingFilter({ filter }, val, projection = applied.defaultColumnsSelection) {
        const affectedIds = _.map("_id", await applied.find({ filter }, { _id: 1 }));
        return (
          applied
            .collection()
            .updateMany(filter, { $set: applied.prepModification(val) })
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

      /**
       * Just modifies the updatedAt timestamp.
       * @param {string|ObjectID} id
       * @param {Projection} projection
       * @returns {Promise<Document>}
       */
      function touch(id, projection) {
        return applied.doUpdateById(id, { [collection.timestampKeys.updatedAt]: new Date() }, projection);
      }

      /**
       * Deletes the document by id
       * @param {string|ObjectID} id
       * @returns {Promise<string>} the deleted id
       */
      function del(id) {
        return applied.collection
          .deleteOne({ _id: id })
          .then(
            // @ts-ignore
            (result) => {
              if (result.deletedCount === 0) {
                throw new newError.NotFound(`${collection.entityName} ${id} not found`);
              }
              return id;
            }
          )
          .then(() => {
            publish(collection.entityName, `deleted`, { id }, context);
            return id;
          });
      }

      /**
       * Deletes the object using a query
       * @param {Query} query
       * @returns {Promise<string[]>} the deleted ids
       */
      async function delUsingFilter({ filter }) {
        // use find to get the affected id's. This is subject to race conditions, so consumers must be aware they may receive a deleted message twice
        const affectedIds = _.map("_id", await applied.find({ filter }, { _id: 1 }));
        return applied.collection.deleteMany(filter).then(() => {
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
        get defaultColumnsSelection() {
          return collection.defaultProjection;
        },
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
    }
  );
}

module.exports = init;
