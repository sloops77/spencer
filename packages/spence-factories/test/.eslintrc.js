// eslint-disable-next-line global-require
const parentEslintRc = { ...require("../../../.eslintrc") };
parentEslintRc.rules["max-lines"] = ["off"];
parentEslintRc.rules["max-nested-callbacks"] = ["off"];
module.exports = parentEslintRc;
