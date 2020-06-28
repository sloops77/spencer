/* eslint-disable global-require */
const { mongoFactory, mongoClient, mongoDb, mongoClose } = require("./mongodb-factory");

module.exports = { mongoFactory, mongoClient, mongoDb, mongoClose, mongodbPlugin: require("./mongodb-plugin") };
