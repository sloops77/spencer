const _ = require("lodash/fp");
const env = require("../src/env");
const log = require("../src/log");

describe("core", () => {
  it("should load an env", () => {
    expect(env.nodeEnv).toEqual("test");
  });
  it("should load a log", () => {
    expect(_.isFunction(log.info)).toEqual(true);
  });
});
