module.exports = {
  extends: [
    "airbnb-base",
    "prettier",
  ],
  plugins: ["prettier"],
  parserOptions: {
    sourceType: "module"
  },
  env: {
    node: true,
    jest: true
  },
  rules: {
    complexity: ["error", 6],
    "max-depth": ["error", { max: 2 }],
    "max-lines": ["error", 150],
    "max-nested-callbacks": ["error", 3],
    "no-console": ["error", { allow: ["warn", "error"] }],
    "no-underscore-dangle": ["error", {allow: ["_id"] }],
    "no-use-before-define": 0, // override airbnb
    "prettier/prettier": "error",
    "no-restricted-syntax": [
      "error",
      {
        "selector": "ForInStatement",
        "message": "for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array."
      },
      {
        "selector": "LabeledStatement",
        "message": "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand."
      },
      {
        "selector": "WithStatement",
        "message": "`with` is disallowed in strict mode because it makes code impossible to predict and optimize."
      }
    ]
  }
};
