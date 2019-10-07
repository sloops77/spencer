const _ = require("lodash/fp");
const idParam = require("./schemas/id-param");
const responses = require("./responses");

function init(tag) {
  function tagify(base) {
    if (tag == null) {
      return base;
    }

    return Object.assign(base, { tags: [tag] });
  }

  function insertOne(body, result) {
    return { body, response: responses({ 201: result }, { notFound: false }) };
  }

  function findOne(result) {
    return { params: idParam, response: responses({ 200: result }) };
  }

  function deleteOne() {
    return {
      params: idParam,
      response: responses({ 204: { type: "null", description: "Successfully deleted item" } })
    };
  }

  function updateOne(body, result = body) {
    return { params: idParam, body, response: responses({ 200: result }) };
  }

  function findMany(result) {
    return {
      querystring: { limit: { type: "number" }, offset: { type: "number" } },
      response: responses({ 200: { type: "array", items: result } })
    };
  }

  return _.mapValues(
    fn =>
      _.flow(
        fn,
        tagify
      ),
    { insertOne, findOne, updateOne, deleteOne, findMany }
  );
}

module.exports = init;
