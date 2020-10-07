import * as https from 'https';
import * as util from 'util';
import { IncomingMessage } from 'http';
import { SNSEvent } from 'aws-lambda';

interface PostDataAttachment {
  color?: string;
  text?: string;
  fields?: {
    title: string;
    value: string;
    short: boolean;
  }[];
}

interface SlackHookPostData {
  username: string;
  text: string;
  icon_emoji: string;
  attachments: PostDataAttachment[];
}

enum Severity {
  Good = 'good',
  Warning = 'warning',
}

const slackWebhook = process.env.SLACK_WEBHOOK as string;

export const snsToSlackHandler = async (event: SNSEvent): Promise<void> => {
  const message = JSON.parse(event?.Records[0]?.Sns?.Message || '{}');
  const region = event?.Records[0]?.EventSubscriptionArn?.split(':')[3];
  const { AlarmName } = message;
  const severity = message?.NewStateValue === 'OK' ? Severity.Good : Severity.Warning;
  const cwUrl =
    region &&
    'https://console.aws.amazon.com/cloudwatch/home?region=' +
      region +
      '#alarm:alarmFilter=ANY;name=' +
      encodeURIComponent(AlarmName);

  const slackMessageFields = {
    CloudWatchUrl: cwUrl,
    ...message,
  };

  const allowedFields = [
    'CloudWatchUrl',
    'AlarmDescription',
    'NewStateReason',
    'NewStateValue',
    'OldStateValue',
    'StateChangeTime',
    'Region',
  ];

  const postData: SlackHookPostData = {
    username: 'AWS CloudWatch Warning',
    text: '*' + event.Records[0].Sns.Subject + '*',
    // eslint-disable-next-line @typescript-eslint/camelcase
    icon_emoji: ':aws:',
    attachments: [
      {
        color: severity,
        fields: Object.keys(slackMessageFields)
          .filter(key => allowedFields.includes(key))
          // filter out empty values
          .filter(key => slackMessageFields[key])
          .map(key => {
            return {
              title: key,
              value: slackMessageFields[key],
              short: false,
            };
          }),
      },
    ],
  };

  const slackHostname = 'hooks.slack.com';
  const options: https.RequestOptions = {
    method: 'POST',
    hostname: slackHostname,
    port: 443,
    path: (slackWebhook || '').replace(`https://${slackHostname}`, ''),
  };

  await new Promise((resolve, reject) => {
    const req = https.request(options, (res: IncomingMessage) => {
      res.setEncoding('utf8');
      res.on('data', () => {
        resolve();
      });
    });

    req.on('error', (e: Error) => {
      reject(e);
    });

    req.write(util.format('%j', postData));
    req.end();
  });
};
