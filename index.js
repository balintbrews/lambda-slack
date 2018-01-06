const got = require('got');

const { slackWebhookUrl, slackChannel } = process.env;

/**
 * Posts a message to Slack.
 *
 * @param {Object} message
 *   Object describing the message to be sent to the Slack API.
 * @param callback
 *   Callback to return information to the Lambda caller.
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

function processEvent(event, callback) {
  const buildArn = event.detail['build-id'];
  const buildId = buildArn.split('/').pop();
  const buildUuid = buildId.split(':').pop();
  const projectName = event.detail['project-name'];
  const buildLink = `https://${event.region}.console.aws.amazon.com/codebuild/home?region=${event.region}#/builds/${encodeURI(buildId)}/view/new`;
  const logLink = event.detail['additional-information'].logs['deep-link'];

  const slackMessageContent = {};
  switch (event.detail['build-status']) {
    default:
    case 'SUCCEEDED':
      slackMessageContent.fallback = `New successful build for ${projectName}: ${buildUuid}.`;
      slackMessageContent.pretext = `Look, there is a new successful build for ${projectName}! :sunglasses:`;
      slackMessageContent.color = '#abc8b6';
      slackMessageContent.status = 'Things look great! :+1:';
      break;
    case 'FAILED':
      slackMessageContent.fallback = `New failed build for ${projectName}: ${buildUuid}.`;
      slackMessageContent.pretext = `Oops, a failed build for ${projectName}! :thinking_face:`;
      slackMessageContent.color = '#e8674a';
      slackMessageContent.status = 'Something is wrong. :point_left:';
      break;
    case 'STOPPED':
      slackMessageContent.fallback = `A build has been stopped for ${projectName}: ${buildUuid}.`;
      slackMessageContent.pretext = `A build for ${projectName} has been stopped for some reason. :zipper_mouth_face:`;
      slackMessageContent.color = '#f2cd90';
      slackMessageContent.status = 'Not really sure. :construction:';
      break;
  }

  const slackMessage = {
    channel: slackChannel,
    username: 'Relevant Builds',
    icon_url: 'https://s3.us-east-2.amazonaws.com/relevantbits-assets/logo-aws-codebuild.png',
    attachments: [{
      fallback: slackMessageContent.fallback,
      color: slackMessageContent.color,
      pretext: slackMessageContent.pretext,
      fields: [
        {
          title: 'Project',
          value: projectName,
          short: false,
        },
        {
          title: 'Status',
          value: slackMessageContent.status,
          short: false,
        },
        {
          title: 'Build',
          value: `<${buildLink}|View build>`,
          short: true,
        },
        {
          title: 'Full log',
          value: `<${logLink}|View full log>`,
          short: true,
        },
        {
          title: 'Build ID',
          value: buildId,
          short: false,
        },
      ],
    }],
  };

  post(slackMessage, callback);
}

exports.handler = (event, context, callback) => {
  processEvent(event, callback);
};
