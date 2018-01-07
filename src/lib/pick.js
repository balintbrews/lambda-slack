const extractValue = require('./extract');
const _ = {
  for: require('lodash.forown'),
};

/**
 * Match notification with payload.
 * @param {Object} notification - Individual notification from configuration.
 * @param {Object} payload - Event payload the Lambda function received.
 * @returns {boolean} — Whether notification matches payload.
 */
const match = function matchNotificationWithPayload(notification, payload) {
  let matchesAll = true;
  _.for(notification.match, (values, path) => {
    if (typeof values === 'string') {
      throw Error(`Value to match "${values}" is not wrapped in an array.`);
    }
    if (!values.includes(extractValue(payload, path))) {
      matchesAll = false;
    }
  });
  return matchesAll;
};

/**
 * Pick the appropriate notification from config based on match rules.
 * @param {Object} payload - Event payload the Lambda function received.
 * @param {Object} notificationsConfig - Configuration of all notifications.
 * @returns {(Object)|boolean} - Matching notification object from configuration.
 */
const pick = function pickNotification(payload, notificationsConfig) {
  let pickedNotification = false;
  _.for(notificationsConfig, (notification) => {
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

module.exports = pick;
