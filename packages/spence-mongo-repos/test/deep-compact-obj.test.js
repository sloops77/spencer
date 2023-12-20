const deepCompactObj = require("../src/repos/deep-compact-obj");

describe("deep compact obj", () => {
  it("should handle null inputs", () => {
    expect(deepCompactObj(null)).toEqual({});
  });
  it("should handle empty inputs", () => {
    expect(deepCompactObj({})).toEqual({});
  });
  it("should handle simple obj inputs", () => {
    expect(deepCompactObj({ a: 1, b: "string", c: null, d: [1, 2, 3] })).toEqual({ a: 1, b: "string", d: [1, 2, 3] });
  });
  it("should handle deep objects inputs", () => {
    expect(deepCompactObj({ a: 1, b: "string", c: null, d: [1, 2, 3], e: { x: 1, y: null, z: { m: null } } })).toEqual({
      a: 1,
      b: "string",
      d: [1, 2, 3],
      e: { x: 1, z: {} },
    });
  });
  it("should handle deep arrays", () => {
    expect(
      deepCompactObj({
        a: [{ x: 1, y: null, z: { m: null } }, { x: null, y: 2, z: { m: "string" } }, null],
      }),
    ).toEqual({
      a: [{ x: 1, z: {} }, { y: 2, z: { m: "string" } }, null],
    });
  });
});
