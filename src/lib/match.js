const lodashForOwn = require('lodash.forown');
const extractValue = require('./extract');

const _ = {
  for: lodashForOwn,
};

/**
 * Match rules with payload.
 * @param {Object} matchConfig - Individual notification from configuration.
 * @param {Object} payload - Event payload the Lambda function received.
 * @returns {boolean} — Whether rules match the payload.
 */
const match = function matchRulesWithPayload(matchConfig, payload) {
  let everythingMatches = true;
  _.for(matchConfig, (values, path) => {
    if (typeof values === 'string') {
      throw Error(`Value to match "${values}" is not wrapped in an array.`);
    }
    if (!values.includes(extractValue(payload, path))) {
      everythingMatches = false;
    }
  });
  return everythingMatches;
};

module.exports = match;
