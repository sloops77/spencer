const parentEslintRc = { ...require("../../../.eslintrc.js") };
parentEslintRc.rules["max-lines"] = ["off"];
parentEslintRc.rules["max-nested-callbacks"] = ["off"]
module.exports = parentEslintRc;