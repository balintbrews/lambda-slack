const _ = {
  get: require('lodash.get'),
};

/**
 * Extract value from object based on a path defined with dot notation, e.g.: $.prop-x.prop-y.
 * @param {Object} obj - Object from where value should be extracted.
 * @param {String} path - Path within object defined with dot notation, e.g.: $.prop-x.prop-y.
 * @returns {*} - Value from object, e.g.: $.prop-x.prop-y → obj['prop-x']['prop-y'].
 */
const extractValue = function extractValue(obj, path) {
  if (path.charAt(0) !== '$') {
    throw Error(`Path definition '${path}' is missing the preceding $ symbol.`);
  }
  const pathArray = path.split('.');
  pathArray.shift();
  return _.get(obj, pathArray);
};

module.exports = extractValue;
