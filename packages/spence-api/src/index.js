module.exports = {
  fastifyRest: require("./rest/plugin"),
  initController: require("./rest/controller"),
  handlers: require("./rest/rest-handlers"),
  ...require("./schema-builders"),
  ...require("./hooks"),
};
