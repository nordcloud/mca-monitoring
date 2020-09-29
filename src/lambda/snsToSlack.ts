import * as https from 'https';
import * as util from 'util';

interface PostDataAttachment {
  color?: string;
  text?: string;
}

interface SlackHookPostData {
  // channel: string;
  username: string;
  text: string;
  icon_emoji: string;
  attachments: PostDataAttachment[];
}

export const snsToSlackHandler = async (event: any, context: any): Promise<void> => {
  const { SLACK_WEBHOOK } = process.env;

  const message = event.Records[0].Sns.Message;
  let severity = 'good';

  const dangerMessages = [
    ' but with errors',
    ' to RED',
    'During an aborted deployment',
    'Failed to deploy application',
    'Failed to deploy configuration',
    'has a dependent object',
    'is not authorized to perform',
    'Pending to Degraded',
    'Stack deletion failed',
    'Unsuccessful command execution',
    'You do not have permission',
    'Your quota allows for 0 more running instance',
  ];

  const warningMessages = [
    ' aborted operation.',
    ' to YELLOW',
    'Adding instance ',
    'Degraded to Info',
    'Deleting SNS topic',
    'is currently running under desired capacity',
    'Ok to Info',
    'Ok to Warning',
    'Pending Initialization',
    'Removed instance ',
    'Rollback of environment',
  ];

  for (const dangerMessagesItem in dangerMessages) {
    if (message.indexOf(dangerMessages[dangerMessagesItem]) != -1) {
      severity = 'danger';
      break;
    }
  }

  // Only check for warning messages if necessary
  if (severity == 'good') {
    for (const warningMessagesItem in warningMessages) {
      if (message.indexOf(warningMessages[warningMessagesItem]) != -1) {
        severity = 'warning';
        break;
      }
    }
  }

  const postData: SlackHookPostData = {
    // channel: SLACK_CHANNEL_NAME as string,
    username: 'AWS CloudWatch Warning',
    text: '*' + event.Records[0].Sns.Subject + '*',
    // eslint-disable-next-line @typescript-eslint/camelcase
    icon_emoji: ':aws:',
    attachments: [
      {
        color: severity,
        text: message,
      },
    ],
  };

  const slackHostname = 'hooks.slack.com';
  const options = {
    method: 'POST',
    hostname: slackHostname,
    port: 443,
    path: (SLACK_WEBHOOK || '').replace(`https://${slackHostname}`, ''),
  };

  const req = https.request(options, function(res: any) {
    res.setEncoding('utf8');
    res.on('data', () => {
      context.done(null);
    });
  });

  req.on('error', (e: any) => {
    context.done(e);
  });

  req.write(util.format('%j', postData));
  req.end();
};
