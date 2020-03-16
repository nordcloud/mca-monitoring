import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';
import { chunk } from '../utils/utils';

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
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    tables: config.ConfigLocals,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    // Setup tables
    Object.keys(tables).forEach(tableName => {
      const tableConfig = tables[tableName];
      const dimensions = {
        TableName: tableName,
      };

      tableMetrics.forEach(metricName => {
        this.setupAlarm(tableName, metricName, tableConfig, dimensions);
      });
    });
  }
}

// Setup table alarms
export function createDynamoDBMonitoring(stack: cdk.Stack, snsStack: NestedSNSStack): NestedTableAlarmsStack[] {
  const tables = config.configGetAllEnabled(localType, tableMetrics);
  const tableKeys: string[] = Object.keys(tables);

  // Nothing to create
  if (tableKeys.length === 0) {
    return [];
  }

  // Split over 30 tables to multiple stacks
  if (tableKeys.length > 30) {
    return chunk(tableKeys, 30).map((tableKeys, index) => {
      const stackTables = config.configGetSelected(localType, tableKeys);
      return new NestedTableAlarmsStack(stack, stack.stackName + '-table-alarms-' + (index + 1), snsStack, stackTables);
    });
  }

  // Create single stack
  return [new NestedTableAlarmsStack(stack, stack.stackName + '-table-alarms', snsStack, tables)];
}
