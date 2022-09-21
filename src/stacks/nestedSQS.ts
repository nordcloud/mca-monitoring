import { NestedStackProps, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';

export const sqsMetrics = [
  'ApproximateAgeOfOldestMessage',
  'ApproximateNumberOfMessagesDelayed',
  'ApproximateNumberOfMessagesNotVisible',
  'ApproximateNumberOfMessagesVisible',
  'NumberOfEmptyReceives',
  'NumberOfMessagesDeleted',
  'NumberOfMessagesReceived',
  'NumberOfMessagesSent',
  'SentMessageSize'
];

const defaultType = config.ConfigDefaultType.SQS;
const localType = config.ConfigLocalType.SQS;

export class NestedSQSAlarmsStack extends BaseNestedStack {
  constructor(
    scope: Construct,
    id: string,
    snsStack: NestedSNSStack,
    sqsQueues: config.ConfigLocals<config.ConfigMetricAlarms>,
    props?: NestedStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    Object.keys(sqsQueues).forEach(queueName => {
      const sqsConfig = sqsQueues[queueName];
      const dimensions = {
        QueueName: queueName
      };

      sqsMetrics.forEach(metricName => {
        if (sqsConfig[metricName]) {
          this.setupAlarm(queueName, metricName, sqsConfig[metricName], dimensions);
        }
      })
    });
  }
}

export function createSQSMonitoring(stack: Stack, snsStack: NestedSNSStack, versionReportingEnabled = true): NestedSQSAlarmsStack[] {
  return config.chunkByStackLimit(localType, sqsMetrics, 0, versionReportingEnabled).map((sqsQueues, index) => {
    return new NestedSQSAlarmsStack(
      stack,
      stack.stackName + '-sqs-alarms-' + (index + 1),
      snsStack,
      sqsQueues
    );
  });
}
