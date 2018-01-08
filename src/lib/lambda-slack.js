const createVariables = require('./variables');
const config = require('../../config.json');
const pick = require('./pick');
const post = require('./post');
const replace = require('./replace');

/**
 * Process Lambda event.
 * @param {Object} event - Event payload the Lambda function received.
 * @param {Function} callback - Callback to return information to the Lambda caller.
 */
const lamdbaSlack = function processEvent(event, callback) {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const notification = pick(config, event);
  if (notification === false) {
    console.log('No notification has been sent.');
    callback(null);
    return;
  }
  const variables = createVariables(notification.variables, event);
  const slackMessage = replace(notification.slackMessage, variables);
  post(notification.slackMessage.webhook, slackMessage, notification.name, callback);
};

module.exports = lamdbaSlack;
