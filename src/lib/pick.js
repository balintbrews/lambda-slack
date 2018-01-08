const lodashForOwn = require('lodash.forown');
const match = require('./match');

const _ = {
  for: lodashForOwn,
};

/**
 * Pick the appropriate notification from config based on match rules.
 * @param {Object} notificationsConfig - Configuration of all notifications.
 * @param {Object} payload - Event payload the Lambda function received.
 * @returns {(Object)|boolean} - Matching notification object from configuration.
 */
const pick = function pickNotification(notificationsConfig, payload) {
  let pickedNotification = false;
  _.for(notificationsConfig, (notification) => {
    if (Object.prototype.hasOwnProperty.call(notification, 'match')) {
      if (match(notification.match, payload)) {
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
