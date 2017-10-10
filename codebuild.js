const url = require('url');
const https = require('https');

const { slackWebhookUrl, slackChannel } = process.env;

function postMessage(message, callback) {
  const body = JSON.stringify(message);
  const options = url.parse(slackWebhookUrl);
  options.method = 'POST';
  options.headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  };

  const postReq = https.request(options, (res) => {
    const chunks = [];
    res.setEncoding('utf8');
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
      if (callback) {
        callback({
          body: chunks.join(''),
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
        });
      }
    });
    return res;
  });

  postReq.write(body);
  postReq.end();
}

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

  postMessage(slackMessage, (response) => {
    if (response.statusCode < 400) {
      // eslint-disable-next-line no-console
      console.info('Message posted successfully');
      callback(null);
    } else if (response.statusCode < 500) {
      // eslint-disable-next-line no-console
      console.error(`Error posting message to Slack API: ${response.statusCode} - ${response.statusMessage}`);
      // Don't retry because the error is due to a problem with the request.
      callback(null);
    } else {
      // Let Lambda retry
      callback(`Server error when processing message: ${response.statusCode} - ${response.statusMessage}`);
    }
  });
}

exports.handler = (event, context, callback) => {
  processEvent(event, callback);
};
