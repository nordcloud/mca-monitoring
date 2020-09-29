import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as lambda from '@aws-cdk/aws-lambda';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';

export class NestedSlackNotificationsStack extends cfn.NestedStack {
  constructor(
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    webhook: string,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, props);

    const handler = new lambda.Function(this, 'SnsToSlackHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('node_modules/mca-monitoring/dist/lambda'),
      handler: 'snsToSlackHandler',
      environment: {
        SLACK_WEBHOOK: webhook,
      },
    });

    // subscribe to sns topic
    snsStack.addLambdaSubscription(handler);
  }
}

// Setup slack notifications
export function createNestedSlackNotifications(
  stack: cdk.Stack,
  snsStack: NestedSNSStack,
): NestedSlackNotificationsStack[] {
  const { webhook } = config.configGetCustomSlackNotifications() || {};

  // Nothing to create
  if (!webhook) {
    return [];
  }

  return [new NestedSlackNotificationsStack(stack, stack.stackName + '-slack-notifications', snsStack, webhook)];
}
