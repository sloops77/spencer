/**
 * @typedef {import("./types").ServiceError} ServiceError
 */
/**
 * @param {string} errorCode
 * @param {number} statusCode
 * @param {object=} data
 * @returns {ServiceError}
 */
function newError(errorCode, statusCode, data) {
  /** @type {ServiceError} */
  const error = new Error(errorCode);
  error.statusCode = statusCode;
  error.errorCode = errorCode;
  error.data = data;
  return error;
}

module.exports = newError;
