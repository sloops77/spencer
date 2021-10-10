const _ = require("lodash/fp");
const idParam = require("./schemas/id-param.json");
const responses = require("./response-schema-builder");

function init(tag) {
  function tagify(base) {
    if (tag == null) {
      return base;
    }

    return Object.assign(base, { tags: [tag] });
  }

  function findOne(result) {
    return { params: idParam, response: responses({ 200: result }) };
  }

  function findMany(result, overrides = {}) {
    return _.defaultsDeep(overrides, {
      querystring: { limit: { type: "number" }, offset: { type: "number" } },
      response: responses({ 200: { type: "array", items: result } }),
    });
  }

  function insertOne(body, result) {
    return { body, response: responses({ 201: result }, { notFound: false }) };
  }

  function updateOne(body, result = body) {
    return { params: idParam, body, response: responses({ 200: result }) };
  }

  function deleteOne() {
    return {
      params: idParam,
      response: responses({ 204: { type: "null", description: "Successfully deleted item" } }),
    };
  }

  function rpc(body, result, { notFound = true, successStatusCode = 200 }) {
    return { body, response: responses({ [successStatusCode]: result }, { notFound }) };
  }

  return {
    ..._.mapValues((fn) => _.flow(fn, tagify), { insertOne, findOne, updateOne, deleteOne, findMany, rpc }),
    responses,
    idParam,
  };
}

module.exports = init;
