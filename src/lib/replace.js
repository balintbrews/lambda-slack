const lodashAssignIn = require('lodash.assignin');
const lodashForOwn = require('lodash.forown');
const lodashMapValues = require('lodash.mapvalues');

const _ = {
  assignIn: lodashAssignIn,
  for: lodashForOwn,
  mapValues: lodashMapValues,
};

/**
 * Adjust variable names by adding enclosing `<` and `>` signs.
 * @param {Object} variablesObj - Variables object.
 * @returns {Object} - New variables object with adjusted names.
 */
const adjustVariableNames = function adjustVariableNamesWithEnclosingSigns(variablesObj) {
  const newVariablesObj = {};
  _.for(variablesObj, (value, key) => {
    newVariablesObj[`<${key}>`] = value;
  });
  return newVariablesObj;
};

/**
 * Manipulates all properties of an object recursively.
 * (Simplified version of lodash-deep 2.0.0.)
 * @param {Object} obj - Object to manipulate.
 * @param {Function} cb - Callback function returning the new value for each property.
 */
const map = function deepMapValues(obj, cb) {
  if (obj instanceof Object) {
    return _.assignIn(obj, _.mapValues(obj, values => map(values, cb)));
  } else if (obj instanceof Array) {
    _.for(obj, values => map(values, cb));
  }
  return cb(obj);
};

/**
 * Replace variables (defined like `<variable>`) in all strings of all levels in an object.
 * @param {Object} obj - Object in which variables should be replaced.
 * @param {Object} variables - Variables definition.
 * @returns {Object} - New object with replaced variables.
 */
const replace = function replaceVariablesInObject(obj, variables) {
  const newVariables = adjustVariableNames(variables);
  const regex = new RegExp(Object.keys(newVariables).join('|'), 'gi');
  // Clone the object.
  const replacedObject = JSON.parse(JSON.stringify(obj));
  // Iterate over the object recursively, replace variables on all levels.
  map(replacedObject, (value) => {
    if (typeof value === 'string') {
      return value.replace(regex, matched => newVariables[matched]);
    }
    return value;
  });
  return replacedObject;
};

module.exports = replace;
