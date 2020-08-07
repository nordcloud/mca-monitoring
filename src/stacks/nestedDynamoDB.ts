import * as cdk from '@aws-cdk/core';

import BaseNestedStack, { BaseNestedStackProps } from './baseNestedStack';
import { ConfigMetricAlarmName } from '../utils/types';
import { isEnabled, generateMetricAlarm, chunk, MetricNamespace } from '../utils';
import { MonitoringConfig, ConfigMetricAlarm } from '../utils/types';
import { getTables } from '../aws-sdk';

export interface DynamoDBConfigProps {
  ConditionalCheckFailedRequests?: ConfigMetricAlarm;
  ConsumedReadCapacityUnits?: ConfigMetricAlarm;
  ConsumedWriteCapacityUnits?: ConfigMetricAlarm;
  MaxProvisionedTableReadCapacityUtilization?: ConfigMetricAlarm;
  MaxProvisionedTableWriteCapacityUtilization?: ConfigMetricAlarm;
  OnlineIndexConsumedWriteCapacity?: ConfigMetricAlarm;
  OnlineIndexPercentageProgress?: ConfigMetricAlarm;
  OnlineIndexThrottleEvents?: ConfigMetricAlarm;
  PendingReplicationCount?: ConfigMetricAlarm;
  ProvisionedReadCapacity?: ConfigMetricAlarm;
  ProvisionedWriteCapacity?: ConfigMetricAlarm;
  ReadThrottleEvents?: ConfigMetricAlarm;
  ReplicationLatency?: ConfigMetricAlarm;
  ReturnedBytes?: ConfigMetricAlarm;
  ReturnedItemCount?: ConfigMetricAlarm;
  ReturnedRecordsCount?: ConfigMetricAlarm;
  SystemErrors?: ConfigMetricAlarm;
  TimeToLiveDeletedItemCount?: ConfigMetricAlarm;
  ThrottledRequests?: ConfigMetricAlarm;
  TransactionConflict?: ConfigMetricAlarm;
  WriteThrottleEvents?: ConfigMetricAlarm;
}

export type DynamoDBProps = MonitoringConfig<DynamoDBConfigProps>;

export type DynamoDBPropsKeys = (keyof DynamoDBConfigProps)[];

// From https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/metrics-dimensions.html
export const dynamoDBMetrics: DynamoDBPropsKeys = [
  'ConditionalCheckFailedRequests',
  'ConsumedReadCapacityUnits',
  'ConsumedWriteCapacityUnits',
  'MaxProvisionedTableReadCapacityUtilization',
  'MaxProvisionedTableWriteCapacityUtilization',
  'OnlineIndexConsumedWriteCapacity',
  'OnlineIndexPercentageProgress',
  'OnlineIndexThrottleEvents',
  'PendingReplicationCount',
  'ProvisionedReadCapacity',
  'ProvisionedWriteCapacity',
  'ReadThrottleEvents',
  'ReplicationLatency',
  'ReturnedBytes',
  'ReturnedItemCount',
  'ReturnedRecordsCount',
  'SystemErrors',
  'TimeToLiveDeletedItemCount',
  'ThrottledRequests',
  'TransactionConflict',
  'WriteThrottleEvents',
];

export interface NestedDynamoDBAlarmStackProps extends BaseNestedStackProps {
  metricAlarms: ConfigMetricAlarmName[];
}

export class NestedDynamoDBAlarmsStack extends BaseNestedStack {
  constructor(scope: cdk.Construct, id: string, props: NestedDynamoDBAlarmStackProps) {
    super(scope, id, props);

    props.metricAlarms.forEach(metricAlarm => {
      const dimensions = {
        TableName: metricAlarm.resourceName,
      };

      this.setupAlarm(metricAlarm, MetricNamespace.DynamoDB, dimensions);
    });
  }
}

// Setup table alarms
export async function createDynamoDBMonitoring(
  stack: cdk.Stack,
  props?: DynamoDBProps,
): Promise<NestedDynamoDBAlarmsStack[]> {
  const tables = await getTables(props?.include, props?.exclude);
  const metricAlarms: ConfigMetricAlarmName[] = [];

  tables.forEach(table => {
    dynamoDBMetrics.forEach(metric => {
      const defaultConf = props?.default?.[metric];
      const localConf = props?.local?.[table]?.[metric];
      if (isEnabled(defaultConf, localConf)) {
        metricAlarms.push(generateMetricAlarm(metric, table, defaultConf, localConf));
      }
    });
  });

  if (metricAlarms.length === 0) {
    return [];
  }

  // Split more than 50 lambdas to multiple stacks
  if (metricAlarms.length > 50) {
    return chunk(metricAlarms, 50).map((metricAlarms, index) => {
      return new NestedDynamoDBAlarmsStack(stack, stack.stackName + '-dynamodb-alarms-' + (index + 1), {
        snsStack: props?.snsStack,
        metricAlarms,
      });
    });
  }

  // Create single stack
  return [
    new NestedDynamoDBAlarmsStack(stack, stack.stackName + '-dynamodb-alarms', {
      snsStack: props?.snsStack,
      metricAlarms,
    }),
  ];
}
