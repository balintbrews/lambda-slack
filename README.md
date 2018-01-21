# `lambda-slack`

AWS Lambda function for sending highly customizable messages to Slack using data from any kind of payload, i.e. CloudWatch events or HTTP requests received through API Gateway endpoints.

## Overview

The `lambda-slack` project allows you to set up notifications about various events. It can process any event that you can trigger within the AWS ecosystem and send the payload to AWS Lambda—including payloads received through an API Gateway, which means you are not even tied to AWS. If you can perform an HTTP request and send some data, `lamdba-slack` can work with that too.

### Set up notifications from various sources

Here are a few example use-cases:

* Build statuses from Jenkins, Travis CI, GitLab CI, CircleCI, Codeship etc.;
* Build state or phase changes from AWS CodeBuild;
* Stage execution state changes from AWS CodePipeline;
* AWS CloudWatch events;
* AWS Elastic Beanstalk events;
* Custom events from your application, ie. new signups, new purchases etc.

### Compose your own messages

You have full control over how messages are delivered:

* Channel, username, avatar image, text, attachments—everything that [the amazing Slack API](https://api.slack.com/docs/message-formatting) supports can be customized.
* Different messages can be sent based on rules, i.e. build success vs. build failure can trigger messages with slightly different content.
* You can set up several notification types using a single configuration file.

Check out [`config.example.json`](https://github.com/balintk/lambda-slack/blob/master/config.example.json) for an example setup.

### Deploy easily to AWS Lambda

`lambda-slack` utilizes [Serverless](https://serverless.com) under the hood to faciliate easy and quick deployments to AWS Lambda.

## Configuration

After cloning the repository from GitHub, you will only need to create a single config file named **`config.json`**. (Copying the `config.example.json` file might be a good start.)

The config file should contain a **JSON array**. **Every item** of this array **should be an object which represents a notification you wish to set up**. The appropriate notification will be chosen based on your configuration and the event payload the Lambda function receives.

### Anatomy of a notification

Before describing how a notification should be defined, it's practical to introduce two terms that will play important roles: *path definition* and *match rules*.

#### Path definition

A path definition refers to a certain part of the payload. It is expressed with the dot notation and a preceding `$` symbol.  
E.g. consider the following payload:

```json
{
  "project": {
    "id": "acme",
    "name": "Acme App"
  },
  "event": "build",
  "details": {
    "status": "success"
  }
}
```
To extract all values these path definitions can be defined:

* `$.project.id`;
* `$.project.name`;
* `$.event`;
* `$.details.status`.

#### Match rules

Match rules **check for certain values in the payload** and tell us whether the payload has them at the defined places.  
An example match rules definition would be:

```json
{
  "$.project.id": ["acme"],
  "$.details.status": ["success", "failure"]
}
```

These match rules would return `true` with the above payload.

Match rules are defined as an object. Keys describe paths within the payload where values should be checked. They are expressed with the dot notation and a preceding `$` symbol. Values should be arrays containing the possible values. If any of the values are found at the path the key defines, the rule will return `true`. All rules need to return `true` in order to have a `true` returned as the result of the evaluation. (In other words match rules are evaluated with the logical `AND` operator, but values inside rules are checked with `OR`.)

#### Notification object

With *path definitions* and *match rules* we have established a vocabulary to define a notification object.


|Property|Description|
|--------|-----------|
|`name`|Name of the notification. It helps you to identify your notification and will show up in the logs that will belong to your AWS Lambda function.|
|`match`|Optional match rules object. Determines if the notification should be selected for delivery.|
|`variables`.|Optional object to define variables that can be used as replacement tokens in values that are sent to Slack. Keys should be the desired variable names, values should be path definitions against the payload. The extracted values will be assigned to the variables. Variables can also have different values assigned based on match rules. In this case, instead of a simple path definition, you can define an object where keys are the possible values. For each key you should include match rules under a `match` key.|
|`slackMessage`|The message that will be sent to Slack. Check out Slack's [message builder](https://api.slack.com/docs/messages/builder) and [documentation](https://api.slack.com/docs/message-formatting) to learn about the required format.|

##### Example

```json
{
  "name": "Build Notification",
  "match": {
    "$.source": ["aws.codebuild"],
    "$.detail-type": ["CodeBuild Build State Change"]
  },
  "variables": {
    "project": "$.detail.project-name",
    "status": "$.detail.build-status",
    "aws-region": "$.region",
    "log-stream-name": "$.detail.additional-information.logs.stream-name",
    "color": {
      "good": {
        "match": {
          "$.detail.build-status": ["SUCCEEDED"]
        }
      },
      "danger": {
        "match": {
          "$.detail.build-status": ["FAILED"]
        }
      },
      "warning": {
        "match": {
          "$.detail.build-status": ["STOPPED"]
        }
      }
    }
  },
  "slackMessage": {
    "webhook": "https://hooks.slack.com/services/xyz/xyz/xyz",
    "channel": "builds",
    "username": "notification bot",
    "icon_url": "https://png.icons8.com/ultraviolet/540/bot.png",
    "attachments": [{
      "fallback": "Build <status> for <project> project.",
      "color": "<color>",
      "fields": [
        {
          "title": "Build",
          "value": "<project> (<https://<aws-region>.console.aws.amazon.com/codebuild/home?region=<aws-region>#/builds/<project>:<log-stream-name>/view/new|view build run>)",
          "short": true
        },
        {
          "title": "Status",
          "value": "<status>",
          "short": true
        }
      ]
    }]
  }
}
``````

## Testing

After creating your config file, you can do a test run locally using a sample JSON-formatted payload file. There are samples in the repository, but you can create the payload file for yourself to match your events that you will be receiving.

To perform a test run, issue the following command:

	❯ node src/test_run.js path-to-payload.json

## Deployment to AWS Lambda

### Initial setup

1. Ensure that you have an AWS account set up. If you're new to Amazon Web Services, you need to put in a credit card, otherwise you may not be able to deploy your function. AWS Lambda is part of the non-expiring [AWS Free Tier](https://aws.amazon.com/free/#AWS_FREE_TIER). Please be sure that you understand the details of the free tier for AWS Lambda.
2. [Create a new Lambda function](https://docs.aws.amazon.com/lambda/latest/dg/get-started-create-function.html) in the **US East (Ohio) region** (`us-east-2`) named **`slackNotifications`**. (If you wish to change these values, override them in `serverless.yml`. *@todo Make this configurable.*) You don't need to add code to the function—that part is automated.
3. Make sure you have [an IAM user](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#create-iam-users) and you obtained the [access key ID and secret access key](https://docs.aws.amazon.com/general/latest/gr/aws-access-keys-best-practices.html) for the user account.
4. Execute the following command with your own access keys to set up an AWS profile:

		❯ ./node_modules/serverless/bin/serverless config credentials --provider aws --key AKIAIOSFODNN7EXAMPLE --secret wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

Now you're ready to deploy your function using [Serverless](https://serverless.com). You can forget about the above steps, things will get much simpler from here.

### Deployment

	❯ npm run deploy

(Or if you prefer, use `$ yarn deploy`.)

With this single command you can deploy a new version of your function. Whenever you change your configuration just issue this command, and your function will be shipped to AWS Lambda in a few seconds.
