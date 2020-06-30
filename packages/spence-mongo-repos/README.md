# SpenceJs: Mongo Repos

## Introduction
Spencer repos are a way to share the most common logic of your data layer, making it easy to do the most common queries or persistence operations.
- easy to use
- simple (only 400 lines of code)
- offers access to the full power of the mongo driver to the user when they need to do more complex queries such as aggregation pipelines. No point building an abstraction over that
- manage sideeffects in a decoupled way by using @spencejs/spence-events. Bootstrap your Event Driven Architecture! 
- very similar api to relational database using knex means you can migrate easily if you need to.


## Getting Started
For saving documents like:
```json
      _id: ObjectId("507f1f77bcf86cd799439011"),
      aVal: "foobar",
      manyVals: [1,2,3],
      createdAt: "2019-12-22T07:27:33Z",
      updatedAt: "2019-12-22T07:27:33Z"
```

Intialize a repo like this:
```js
function initExampleRepo() {
  return repoFactory({
    name: "examples",
    entityName: "example",
    defaultProjection: {
      _id: 1,
      aVal: 1,
      manyVals: 1,
      createdAt: 1,
      updatedAt: 1,
    }
  });
```

Happy databasing!
```js
const exampleRepo = initExampleRepo();
const insertedDoc = await repo.insert({aVal: "foobar", manyVals: []}); 
console.info(await repo.findById(insertedDoc._id));
```

Output
```json
      _id: ObjectId("507f1f77bcf86cd799439011"),
      aVal: "foobar",
      manyVals: [],
      createdAt: "2020-06-29T12:22:56Z",
      updatedAt: "2020-06-29T12:22:56Z"
```

## Repos
Repos are extensible adapters over a collection that provide operations to add or change docs. It is very easy to add capabilities like multitenant support or soft delete with just a few lines of code.

When creating a repo first define the collection and how you want to interact with it. Then you can add custom extensions.

*Example coming soon*

### Collections
#### name (required)
The name of the collection in the db
#### entityName
The name of a single entity
#### defaultProjection
The default set keys to retrieve for a repo operation.
#### timestampKeys
spence automatically generates timestamp keys `createdAt` & `updatedAt`. Overriding them by suppying a map like
```json
{
      "createdAt": "creationDate",
      "updatedAt": "modificationDate"
}
```
#### mutable
defaults to true. if false the `updatedAt` timestamp will not be set.
#### mockIdGenerator
Set this value so that your @spencejs/spence-factories can generate ids of the correct type without persisting data to the db.

### Extensions
Extensions can be passed into the Repo. They can override the implementation of any of the operaitons listed below. They can be used for modifying any of the arguments then delgating, or completely reimplementing an operation.

### RepoRegistry
The repo registry caches intializations of repo so that there is only ever one created in the entire system across all modules that make up the system. Enables the [reposPlugin](#Fastify-Plugins)

## Fastify Plugins
spence is made with fastify in mind. That means it comes out of the box with plugins that make using fastify easy.

```js
  const { mongodbPlugin, reposPlugin } = require('@spencejs/spence-mongo-repos');
  
  fastify.register(require("fastify-env"); // spence-mongo-repos plugins assumes that fastify.config attribute has been set such as by using fastify-env
  fastify.register(mongodbPlugin); // initializes the mongo db. Uses the folowing config from fastify.config: { mongoConnection, nodeEnv, debug }
  
  fastify.register(reposPlugin); // attaches req.repos which contains all initialized repos to the request object
```

## Operations
### `find({ filter, limit, skip, sort }, projection)`
Find a set of documents matching the filter
- `filter` is a regular mongo query object
- `limit` is the max number fo docs to return
- `skip` is the number of docs to skip
- `sort` is the way to sort things. Use the regular mongo sort object
- `projection` is a regular mongo projection object. Defaults to your default.

### `findById(_id*, projection)`
Finds a single document by id
- `_id` to find
- `projection` is a regular mongo projection object. Defaults to your default.

### `findOne({filter, sort}, projection)` 
Finds the first document to match the filter and sort specified.
- `filter` is a regular mongo query object
- `sort` is the way to sort things. Use the regular mongo sort object
- `projection` is a regular mongo projection object. Defaults to your default.

### `count(filter)`
Counts the documents matching the filter
- `filter` is a regular mongo query object

### `insert(val*, projection)`
Inserts the document. Returns the inserted document matching the projection. Sets `createdAt` & `updatedAt`. Dispatches a created event
- `val` to insert
- `projection` is a regular mongo projection object. Defaults to your default.

### `insertMany(vals*, projection)`
Inserts many documents. Returns the inserted document matching the projection. Sets `createdAt` & `updatedAt`. Dispatches a created events
- `val` to insert
- `projection` is a regular mongo projection object. Defaults to your default.

### `findOrInsert(val*, naturalKey*, projection)`
Find or insert the value. The second argument is the natural key.  Sets `createdAt` & `updatedAt` if an insert occurs. Dispatches a created events if an insert occurs.
- `val` to insert
- `naturalKey`. the attribute within the `val` that should be used as a naturalKey.
- `projection` is a regular mongo projection object. Defaults to your default.

### `update(_id*, val, projection)`
Update by id. Updates all the fields for you. Sets `updatedAt`. Dispatches a updated events.
- `_id` to update
- `val` to set
- `projection` is a regular mongo projection object. Defaults to your default.

### `updateUsingFilter(filter*, val*, projection)`
Update using filters. Updates all the fields for you. Sets `updatedAt`. Dispatches a updated events.
- `filter` is a regular mongo query object. All docs matching the filters.
- `val` to set
- `projection` is a regular mongo projection object. Defaults to your default.

### `upsert(_id*, val*, projection)`
Upserts the passed val. Sets `updatedAt` & dispatches a updated events if an update occurs. Sets `createdAt`, `updatedAt` & dispatches insert events if an insert occurs.
- `_id` to find
- `val` to set or insert
- `projection` is a regular mongo projection object. Defaults to your default.

### `touch(_id*, projection)`
Sets updatedAt on the document only. Does not dispatch updated events
- `_id` to find
- `projection` is a regular mongo projection object. Defaults to your default.

### `del(_id*)`
deletes the document specified by the id.
- `_id` to delete

### `delUsingFilter(filter)`
deletes all documents matching the mongo filter
- `filter` is a regular mongo query object

