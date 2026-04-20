const js = require("@eslint/js");
const globals = require("globals");
const importPlugin = require("eslint-plugin-import");
const prettierConfig = require("eslint-config-prettier");
const prettierPlugin = require("eslint-plugin-prettier");

const airbnbImportSettings = {
  "import/resolver": {
    node: {
      extensions: [".mjs", ".js", ".json"],
    },
  },
  "import/extensions": [".js", ".mjs", ".jsx"],
  "import/core-modules": [],
  "import/ignore": ["node_modules", "\\.(coffee|scss|css|less|hbs|svg|json)$"],
};

const airbnbImportRules = {
  "import/no-unresolved": ["error", { commonjs: true, caseSensitive: true }],
  "import/named": "error",
  "import/default": "off",
  "import/namespace": "off",
  "import/export": "error",
  "import/no-named-as-default": "error",
  "import/no-named-as-default-member": "error",
  "import/no-deprecated": "off",
  "import/no-extraneous-dependencies": [
    "error",
    {
      devDependencies: [
        "test/**",
        "tests/**",
        "spec/**",
        "**/__tests__/**",
        "**/__mocks__/**",
        "test.{js,jsx}",
        "test-*.{js,jsx}",
        "**/*{.,_}{test,spec}.{js,jsx}",
        "**/jest.config.js",
        "**/jest.setup.js",
        "**/vue.config.js",
        "**/webpack.config.js",
        "**/webpack.config.*.js",
        "**/rollup.config.js",
        "**/rollup.config.*.js",
        "**/gulpfile.js",
        "**/gulpfile.*.js",
        "**/Gruntfile{,.js}",
        "**/protractor.conf.js",
        "**/protractor.conf.*.js",
        "**/karma.conf.js",
        "**/.eslintrc.js",
      ],
      optionalDependencies: false,
    },
  ],
  "import/no-mutable-exports": "error",
  "import/no-commonjs": "off",
  "import/no-amd": "error",
  "import/no-nodejs-modules": "off",
  "import/first": "error",
  "import/imports-first": "off",
  "import/no-duplicates": "error",
  "import/no-namespace": "off",
  "import/extensions": [
    "error",
    "ignorePackages",
    {
      js: "never",
      mjs: "never",
      jsx: "never",
    },
  ],
  "import/order": ["error", { groups: [["builtin", "external", "internal"]] }],
  "import/newline-after-import": "error",
  "import/prefer-default-export": "error",
  "import/no-restricted-paths": "off",
  "import/max-dependencies": ["off", { max: 10 }],
  "import/no-absolute-path": "error",
  "import/no-dynamic-require": "error",
  "import/no-internal-modules": ["off", { allow: [] }],
  "import/unambiguous": "off",
  "import/no-webpack-loader-syntax": "error",
  "import/no-unassigned-import": "off",
  "import/no-named-default": "error",
  "import/no-anonymous-default-export": [
    "off",
    {
      allowArray: false,
      allowArrowFunction: false,
      allowAnonymousClass: false,
      allowAnonymousFunction: false,
      allowLiteral: false,
      allowObject: false,
    },
  ],
  "import/exports-last": "off",
  "import/group-exports": "off",
  "import/no-default-export": "off",
  "import/no-named-export": "off",
  "import/no-self-import": "error",
  "import/no-cycle": ["error", { maxDepth: "∞" }],
  "import/no-useless-path-segments": ["error", { commonjs: true }],
  "import/dynamic-import-chunkname": [
    "off",
    {
      importFunctions: [],
      webpackChunknameFormat: "[0-9a-zA-Z-_/.]+",
    },
  ],
  "import/no-relative-parent-imports": "off",
  "import/no-unused-modules": [
    "off",
    {
      ignoreExports: [],
      missingExports: true,
      unusedExports: true,
    },
  ],
};

module.exports = [
  js.configs.recommended,
  prettierConfig,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
    },
    settings: airbnbImportSettings,
    rules: {
      ...airbnbImportRules,
      complexity: ["error", 6],
      "max-depth": ["error", { max: 2 }],
      "max-lines": ["error", 150],
      "max-nested-callbacks": ["error", 3],
      "no-async-promise-executor": "error",
      "no-await-in-loop": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-param-reassign": [
        "error",
        {
          props: true,
          ignorePropertyModificationsFor: [
            "acc",
            "accumulator",
            "e",
            "ctx",
            "context",
            "req",
            "request",
            "res",
            "response",
            "$scope",
            "staticContext",
          ],
        },
      ],
      "no-underscore-dangle": ["error", { allow: ["_id"] }],
      "no-promise-executor-return": "error",
      "no-return-await": "error",
      "no-use-before-define": 0,
      "prefer-promise-reject-errors": ["error", { allowEmptyReject: true }],
      "prettier/prettier": "error",
      "require-await": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector: "ForInStatement",
          message:
            "for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.",
        },
        {
          selector: "ForOfStatement",
          message:
            "iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.",
        },
        {
          selector: "LabeledStatement",
          message: "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.",
        },
        {
          selector: "WithStatement",
          message: "`with` is disallowed in strict mode because it makes code impossible to predict and optimize.",
        },
      ],
    },
  },
  {
    files: ["packages/*/test/**/*.js"],
    rules: {
      "max-lines": "off",
      "max-nested-callbacks": "off",
    },
  },
];
