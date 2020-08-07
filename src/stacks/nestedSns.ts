import * as cdk from '@aws-cdk/core';
import { NestedStack, NestedStackProps } from '@aws-cdk/aws-cloudformation';
import { Topic, ITopic } from '@aws-cdk/aws-sns';
import { EmailSubscription, UrlSubscription } from '@aws-cdk/aws-sns-subscriptions';
import { Alarm } from '@aws-cdk/aws-cloudwatch';
import { SnsAction } from '@aws-cdk/aws-cloudwatch-actions';

export interface NestedSNSStackProps extends NestedStackProps {
  topicId: string;
  topicName: string;
  emails?: string[];
  endpoints?: string[];
}

// Generate nested stack for sns topics
export class NestedSNSStack extends NestedStack {
  private topic: ITopic;
  private topicAction: SnsAction;

  constructor(scope: cdk.Construct, id: string, props: NestedSNSStackProps) {
    super(scope, id, props);

    // Create topic
    this.topic = new Topic(this, `${id}-topic`, {
      displayName: props.topicName,
      topicName: props.topicId,
    });

    // Add email addresses
    (props?.emails || []).forEach(email => {
      this.topic.addSubscription(new EmailSubscription(email));
    });

    // Add endpoints
    (props?.endpoints || []).forEach(endpoint => {
      this.topic.addSubscription(new UrlSubscription(endpoint));
    });

    this.topicAction = new SnsAction(this.topic);
  }

  // Add actions for alarm
  public addAlarmActions(alarm: Alarm, autoResolve = false): void {
    alarm.addAlarmAction(this.topicAction);
    if (autoResolve) {
      alarm.addOkAction(this.topicAction);
    }
  }
}

export function createSNSStack(stack: cdk.Stack, props: NestedSNSStackProps): NestedSNSStack {
  return new NestedSNSStack(stack, stack.stackName + '-sns-topic', props);
}
