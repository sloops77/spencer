module.exports = {
  testEnvironment: "node",
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/index.js",
    "!test/**",
    "!node_modules/**"
  ],
  coverageDirectory: "<rootDir>/reports/coverage/"
};
