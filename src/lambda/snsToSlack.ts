import * as https from 'https';
import * as util from 'util';

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

export const snsToSlackHandler = async (event: any, context: any): Promise<void> => {
  const { SLACK_WEBHOOK } = process.env;

  const message = JSON.parse(event?.Records[0]?.Sns?.Message || {});
  const region = event?.Records[0]?.EventSubscriptionArn?.split(':')[3];
  const { AlarmName } = message;
  const severity = message?.NewStateValue === 'OK' ? 'good' : 'warning';
  const cwUrl =
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
    path: (SLACK_WEBHOOK || '').replace(`https://${slackHostname}`, ''),
  };

  try {
    await new Promise((resolve, reject) => {
      const req = https.request(options, (res: any) => {
        res.setEncoding('utf8');
        res.on('data', () => {
          resolve();
        });
      });

      req.on('error', (e: any) => {
        reject(e);
      });

      req.write(util.format('%j', postData));
      req.end();
    });

    context.done(null);
  } catch (e) {
    console.error(e);
    context.done(e);
  }
};
