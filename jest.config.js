module.exports = {
  testEnvironment: "node",
  collectCoverageFrom: [
    "packages/*/src/**/*.{js,jsx}",
    "!**/src/index.js",
    "!**/fixtures/**",
    "!**/data/**",
    "!**/test/**",
    "!**/node_modules/**",
  ],
  coverageDirectory: "<rootDir>/reports/coverage/",
};
