import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as lambda from '@aws-cdk/aws-lambda';
import * as nodejsLambda from '@aws-cdk/aws-lambda-nodejs';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';

export class NestedSlackNotificationsStack extends cfn.NestedStack {
  constructor(
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    webhook: string,
    topic: string,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, props);

    const handler = new nodejsLambda.NodejsFunction(this, `SnsToSlackHandler-${topic}`, {
      runtime: lambda.Runtime.NODEJS_12_X,
      esbuildVersion: 'v0',
      // is there a better way when referring to file?
      entry: 'node_modules/mca-monitoring/dist/lambda/index.js',
      handler: 'snsToSlackHandler',
      environment: {
        SLACK_WEBHOOK: webhook,
      },
    });

    // subscribe to sns topic
    snsStack.addLambdaSubscription(topic, handler);
  }
}

// Setup slack notifications
export function createNestedSlackNotifications(
  stack: cdk.Stack,
  snsStack: NestedSNSStack,
): NestedSlackNotificationsStack[] {
  const topics = config.configGetSNSTopics() || {};
  const topicKeys = Object.keys(topics) || [];

  // filter topics out that do not have slack webhook(s)
  return topicKeys
    .filter(key => topics[key]?.slackWebhook)
    .map(key => {
      const { slackWebhook } = topics[key];
      return new NestedSlackNotificationsStack(
        stack,
        stack.stackName + '-slack-notifications-' + key,
        snsStack,
        slackWebhook as string,
        key,
      );
    });
}
