const parentEslintRc = { ...require("../.eslintrc.js") };
parentEslintRc.rules["max-lines"] = ["off"];
module.exports = parentEslintRc;