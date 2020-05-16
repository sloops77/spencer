const RestConfigurationError = require("./RestConfigurationError");

const create = {
  method: "POST",
  path: "/",
  schema({ schemas: { createSchema, replySchema }, schemaBuilders: { insertOne } }) {
    if (createSchema == null || replySchema == null) {
      throw new RestConfigurationError(`Must specify a create and reply schema when a create route is specified`);
    }

    return insertOne(createSchema, replySchema);
  },
  handler({ repo }) {
    return async (req, reply) => {
      const result = await repo(req).insert(req.body);
      reply.code(201).send(result);
    };
  },
};

const getById = {
  method: "GET",
  path: "/:id",
  schema({ schemas: { replySchema }, schemaBuilders: { findOne } }) {
    if (replySchema == null) {
      throw new RestConfigurationError(`Must specify a reply schema when a getById route is specified`);
    }

    return findOne(replySchema);
  },
  handler({ repo }) {
    return async (req, reply) => {
      reply.send(await repo(req).findById(req.params.id));
    };
  },
};

const getAll = {
  method: "GET",
  path: "/",
  schema({ schemas: { replySchema }, schemaBuilders: { findMany } }) {
    if (replySchema == null) {
      throw new RestConfigurationError(`Must specify a reply schema when a getAll route is specified`);
    }

    return findMany(replySchema);
  },
  handler({ repo }) {
    return async (req, reply) => {
      const results = await repo(req).find(req.query);
      reply.send(results);
    };
  },
};
const update = {
  method: "PATCH",
  path: "/:id",
  schema({ schemas: { updateSchema, replySchema }, schemaBuilders: { updateOne } }) {
    if (updateSchema == null && replySchema == null) {
      throw new RestConfigurationError(`Must specify a update and reply schema when an update route is specified`);
    }

    return updateOne(updateSchema, replySchema);
  },
  handler({ repo }) {
    return async (req, reply) => {
      const result = await repo(req).update(req.params.id, req.body);
      reply.send(result);
    };
  },
};
const del = {
  method: "DELETE",
  path: "/:id",
  schema({ schemaBuilders: { deleteOne } }) {
    return deleteOne();
  },
  handler({ repo }) {
    return async (req, reply) => {
      await repo(req).del(req.params.id, req.body);
      reply.code(204).send();
    };
  },
};

module.exports = { create, getById, getAll, del, update };
