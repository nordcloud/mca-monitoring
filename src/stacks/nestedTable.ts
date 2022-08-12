import { NestedStackProps, Stack }from 'aws-cdk-lib';
import { Construct } from 'constructs';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';

// From https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/metrics-dimensions.html
export const tableMetrics = [
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

const defaultType = config.ConfigDefaultType.Table;
const localType = config.ConfigLocalType.Table;

export class NestedTableAlarmsStack extends BaseNestedStack {
  constructor(
    scope: Construct,
    id: string,
    snsStack: NestedSNSStack,
    tables: config.ConfigLocals<config.ConfigMetricAlarms>,
    props?: NestedStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    // Setup tables
    Object.keys(tables).forEach(tableName => {
      const tableConfig = tables[tableName];
      const dimensions = {
        TableName: tableName,
      };

      tableMetrics.forEach(metricName => {
        if (tableConfig[metricName]) {
          this.setupAlarm(tableName, metricName, tableConfig[metricName], dimensions);
        }
      });
    });
  }
}

// Setup table alarms
export function createDynamoDBMonitoring(stack: Stack, snsStack: NestedSNSStack, versionReportingEnabled = true): NestedTableAlarmsStack[] {
  return config.chunkByStackLimit(localType, tableMetrics, 0, versionReportingEnabled).map((stackTables, index) => {
    return new NestedTableAlarmsStack(
      stack,
      stack.stackName + '-table-alarms-' + (index + 1),
      snsStack,
      stackTables,
    );
  });
}
