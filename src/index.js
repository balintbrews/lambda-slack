const got = require('got');
const config = require('../config.json');
const pick = require('./lib/pick');

/**
 * Post a message to Slack.
 * @param {Object} message - Object describing the message to be sent to the Slack API.
 * @param {Function} callback - Callback to return information to the Lambda caller.
 */
const post = function postMessageToSlack(message, callback) {
  got.post(slackWebhookUrl, {
    body: JSON.stringify(message),
    headers: { 'content-type': 'application/json' },
  })
    .then((response) => {
      console.log(response.response);
      callback(null);
    })
    .catch((error) => {
      if (error.response.statusCode < 500) {
        console.error(`Error posting message to Slack API: ${error.response.statusCode} - ${error.response.statusMessage}`);
        // Error is due to a problem with the request, invoke callback with
        // null, so Lamdba will not retry.
        callback(null);
      } else {
        // Invoke callback with a message and let Lamdba retry.
        callback(`Server error when processing message: ${error.response.statusCode} - ${error.response.statusMessage}`);
      }
    });
};

/**
 * Process Lambda event.
 * @param {Object} event - Event payload the Lambda function received.
 * @param {Function} callback - Callback to return information to the Lambda caller.
 */
const process = function processEvent(event, callback) {
  const slackMessage = {};
  const notification = pick(event, config);

  console.log(notification);
  console.log(slackMessage);
  // post(slackMessage, callback);
};

exports.handler = (event, context, callback) => {
  process(event, callback);
};
