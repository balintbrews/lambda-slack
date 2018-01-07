const extractValue = require('./extract');
const match = require('./match');
const _ = {
  for: require('lodash.forown'),
};

/**
 * Create variables from payload.
 * Config is an object with keys as the desired variable names and values as
 * paths from the payload.
 * Variables can also be assigned different values based on match criteria.
 * Example:
 *   'color': {
 *     '#abc8b6': {
 *       'match': {
 *         '$.detail.build-status': ['IN_PROGRESS', 'SUCCEEDED']
 *       }
 *     },
 *     '#e8674a': {
 *       'match': {
 *         '$.detail.build-status': ['FAILED']
 *       }
 *     },
 *     '#f2cd90': {
 *       'match': {
 *         '$.detail.build-status': ['STOPPED']
 *       }
 *     }
 *   }
 * @param {Object} variablesConfig - Configuration describing input transforms.
 * @param {Object} payload - Event payload the Lambda function received.
 * @returns {Object} - Human-friendly variables with extracted values.
 */
const createVariables = function createVariablesFromPayload(variablesConfig, payload) {
  const variables = {};
  _.for(variablesConfig, (def, variableName) => {
    if (typeof def === 'string') {
      variables[variableName] = extractValue(payload, def);
    }
    else if (typeof def === 'object') {
      let valueToAssign = '';
      _.for(def, (rule, value) => {
        if (match(rule.match, payload)) {
          valueToAssign = value;
          return false;
        }
      });
      variables[variableName] = valueToAssign;
    }
    else {
      throw Error('Definition of a variable should be either a path or an object with multiple match rules.');
    }
  });
  return variables;
};

module.exports = createVariables;
