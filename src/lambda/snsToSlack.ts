import { SNSEvent } from 'aws-lambda';
import fetch from 'node-fetch';

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

const allowedFields = [
  'CloudWatchUrl',
  'AlarmDescription',
  'NewStateReason',
  'NewStateValue',
  'OldStateValue',
  'StateChangeTime',
  'Region',
];

// absolute url
const slackWebhook = process.env.SLACK_WEBHOOK as string;

export const snsToSlackHandler = async (event: SNSEvent): Promise<void> => {
  const message = JSON.parse(event?.Records[0]?.Sns?.Message || '{}');
  const region = event?.Records[0]?.EventSubscriptionArn?.split(':')[3];
  const subject = event?.Records[0]?.Sns?.Subject;
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

  const postData: SlackHookPostData = {
    username: 'AWS CloudWatch Warning',
    text: `*${subject}*`,
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

  await fetch(slackWebhook, {
    method: 'POST',
    body: JSON.stringify(postData),
  });
};
