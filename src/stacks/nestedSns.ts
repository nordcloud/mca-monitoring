import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as sns from '@aws-cdk/aws-sns';
import * as snsSub from '@aws-cdk/aws-sns-subscriptions';
import * as cw from '@aws-cdk/aws-cloudwatch';
import * as cwa from '@aws-cdk/aws-cloudwatch-actions';
import * as lambda from '@aws-cdk/aws-lambda';
import * as nodejsLambda from '@aws-cdk/aws-lambda-nodejs';

import * as config from '../utils/config';

// Generate nested stack for sns topics
export class NestedSNSStack extends cfn.NestedStack {
  private topics: config.TopicMap<sns.ITopic> = {};
  private topicActions: config.TopicMap<cwa.SnsAction> = {};

  constructor(scope: cdk.Construct, id: string, props?: cfn.NestedStackProps) {
    super(scope, id, props);

    const topics = config.configGetSNSTopics() || {};
    Object.keys(topics).forEach(topic => {
      this.createTopic(topic, topics[topic]);
    });
    this.createResourcesForSlackNotifications(topics);
  }

  private createTopic(topic: string, { id, name, emails = [], endpoints = [] }: config.ConfigCustomSNS): void {
    // Create topic
    this.topics[topic] = new sns.Topic(this, `${id}-${topic}`, {
      displayName: name,
      topicName: id,
    });

    // Add email addresses
    emails.forEach(email => {
      this.topics?.[topic]?.addSubscription(new snsSub.EmailSubscription(email));
    });

    // Add endpoints
    endpoints.forEach(endpoint => {
      this.topics?.[topic]?.addSubscription(new snsSub.UrlSubscription(endpoint));
    });

    this.topicActions[topic] = new cwa.SnsAction(this.topics[topic]);
  }

  // Add actions for alarm
  public addAlarmActions(topic: string, alarm: cw.Alarm, autoResolve = false): void {
    const topicAction = this.topicActions[topic];
    if (!topicAction) {
      throw new Error(`Missing topic actions for topic '${topic}'`);
    }

    alarm.addAlarmAction(topicAction);

    if (autoResolve) {
      alarm.addOkAction(topicAction);
    }
  }

  // Add lambda subscription
  public addLambdaSubscription(topic: string, lambda: lambda.Function): void {
    this.topics?.[topic]?.addSubscription(new snsSub.LambdaSubscription(lambda));
  }

  // Setup slack notifications
  public createResourcesForSlackNotifications(topics: config.TopicMap<config.ConfigCustomSNS> | undefined): void {
    // filter topics out that do not have slack webhook
    Object.keys(topics || {})
      .filter(key => topics?.[key].slackWebhook)
      .map(key => {
        const { slackWebhook } = topics?.[key] || {};

        if (slackWebhook) {
          const handler = new nodejsLambda.NodejsFunction(this, `SnsToSlackHandler-${key}`, {
            runtime: lambda.Runtime.NODEJS_12_X,
            esbuildVersion: 'v0',
            // is there a better way when referring to file?
            entry: 'node_modules/mca-monitoring/dist/lambda/index.js',
            handler: 'snsToSlackHandler',
            environment: {
              SLACK_WEBHOOK: slackWebhook as string,
            },
          });

          this.addLambdaSubscription(key, handler);
        }
      });
  }
}

export function createSNSStack(stack: cdk.Stack): NestedSNSStack {
  if (!config.configGetSNSTopics()) {
    throw new Error('No SNS topics defined in the config');
  }

  return new NestedSNSStack(stack, stack.stackName + '-sns-topic');
}
