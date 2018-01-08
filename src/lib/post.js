const got = require('got');

/**
 * Post a message to Slack.
 * @param {string} slackWebhookUrl - Slack webhook URL.
 * @param {Object} message - Object describing the message to be sent to the Slack API.
 * @param {string} notificationName - Name of notification that is attempted to be sent.
 * @param {Function} callback - Callback to return information to the Lambda caller.
 */
const post = function postMessageToSlack(slackWebhookUrl, message, notificationName, callback) {
  got.post(slackWebhookUrl, {
    body: JSON.stringify(message),
    headers: { 'content-type': 'application/json' },
  })
    .then(() => {
      console.log(`Notification has been sent: ${notificationName}.`);
      callback(null);
    })
    .catch((error) => {
      if (error.response.statusCode < 500) {
        console.error(`Failed to send notification '${notificationName}': ${error.response.statusCode} - ${error.response.statusMessage}`);
        // Error is due to a problem with the request, invoke callback with
        // null, so Lamdba will not retry.
        callback(null);
      } else {
        // Invoke callback with a message and let Lamdba retry.
        callback(`Failed to send notification '${notificationName}' due to a server error: ${error.response.statusCode} - ${error.response.statusMessage}.`);
      }
    });
};

module.exports = post;
