import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as sns from '@aws-cdk/aws-sns';
import * as snsSub from '@aws-cdk/aws-sns-subscriptions';
import * as cw from '@aws-cdk/aws-cloudwatch';
import * as cwa from '@aws-cdk/aws-cloudwatch-actions';

import * as config from '../utils/config';

// Generate nested stack for sns topics
export class NestedSNSStack extends cfn.NestedStack {
  private topic: sns.ITopic;
  private topicAction: cwa.SnsAction;

  constructor(scope: cdk.Construct, id: string, props?: cfn.NestedStackProps) {
    super(scope, id, props);

    const {
      id: topicId,
      name,
      emails = [],
      endpoints = []
    } = config.getSNSTopics() || {};

    // Create topic
    this.topic = new sns.Topic(this, `${id}-topic`, {
      displayName: name,
      topicName: topicId,
    });

    // Add email addresses
    emails.forEach(email => {
      this.topic.addSubscription(new snsSub.EmailSubscription(email));
    });

    // Add endpoints
    endpoints.forEach(endpoint => {
      this.topic.addSubscription(new snsSub.UrlSubscription(endpoint));
    });

    this.topicAction = new cwa.SnsAction(this.topic);
  }

  // Add actions for alarm
  public addAlarmActions(alarm: cw.Alarm, autoResolve = false): void {
    alarm.addAlarmAction(this.topicAction);
    if (autoResolve) {
      alarm.addOkAction(this.topicAction);
    }
  }
}

export function createSNSStack(stack: cdk.Stack): NestedSNSStack {
  if (!config.getSNSTopics()) {
    throw new Error('No SNS topics defined in the config')
  }

  return new NestedSNSStack(stack, stack.stackName + '-sns-topic')
}
