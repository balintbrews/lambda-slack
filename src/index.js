const config = require('../config.json');
const got = require('got');
const _ = {
  forOwn: require('lodash.forown'),
  get: require('lodash.get'),
};

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
 * Extract value from object based on a path defined with dot notation, e.g.: $.prop-x.prop-y.
 * @param {Object} obj - Object from where value should be extracted.
 * @param {String} path - Path within object defined with dot notation, e.g.: $.prop-x.prop-y.
 * @returns {*} - Value from object, e.g.: $.prop-x.prop-y → obj['prop-x']['prop-y'].
 */
const extractValue = function extractValue(obj, path) {
  const pathArray = path.split('.');
  pathArray.shift();
  return _.get(obj, pathArray);
};

/**
 * Match notification with payload.
 * @param {Object} notification - Individual notification from configuration.
 * @param {Object} payload - Event payload the Lambda function received.
 * @returns {boolean} — Whether notification matches payload.
 */
const match = function matchNotificationWithPayload(notification, payload) {
  let matchesAll = true;
  _.forOwn(notification.match, (values, path) => {
    if (!values.includes(extractValue(payload, path))) {
      matchesAll = false;
    }
  });
  return matchesAll;
};

/**
 * Pick the appropriate notification from config based on matching rules.
 * @param {Object} payload - Event payload the Lambda function received.
 * @returns {(Object)|boolean} - Matching notification object from configuration.
 */
const pick = function pickNotification(payload) {
  let pickedNotification = false;
    _.forOwn(config, (notification) => {
    if (Object.prototype.hasOwnProperty.call(notification, 'match')) {
      if (match(notification, payload)) {
        pickedNotification = notification;
        return false;
      }
    } else {
      pickedNotification = notification;
      return false;
    }
  });
  return pickedNotification;
};

/**
 * Process Lambda event.
 * @param {Object} event - Event payload the Lambda function received.
 * @param {Function} callback - Callback to return information to the Lambda caller.
 */
const process = function processEvent(event, callback) {
  const slackMessage = {};
  const notification = pick(event);

  console.log(notification);
  console.log(slackMessage);
  // post(slackMessage, callback);
};

exports.handler = (event, context, callback) => {
  process(event, callback);
};
