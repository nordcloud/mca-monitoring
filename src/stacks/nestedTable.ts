import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cw from '@aws-cdk/aws-cloudwatch';

import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';
import { getAlarmConfig } from '../utils/alarm';
import { getMetricConfig } from '../utils/metric';
import { chunk } from '../utils/utils';

export class NestedTableAlarmsStack extends cfn.NestedStack {
  private snsStack: NestedSNSStack;

  constructor(
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    tables: config.ConfigLocals,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, props);

    this.snsStack = snsStack;

    // Setup tables
    Object.keys(tables).forEach(name => {
      const tableConfig = tables[name];

      // Load table from existing arn
      // const table = dynamodb.Table.fromTableArn(this, name, l.arn);

      // From https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/metrics-dimensions.html
      this.setupTableAlarm(name, 'ConditionalCheckFailedRequests', tableConfig);
      this.setupTableAlarm(name, 'ConsumedReadCapacityUnits', tableConfig);
      this.setupTableAlarm(name, 'ConsumedWriteCapacityUnits', tableConfig);
      this.setupTableAlarm(name, 'MaxProvisionedTableReadCapacityUtilization', tableConfig);
      this.setupTableAlarm(name, 'MaxProvisionedTableWriteCapacityUtilization', tableConfig);
      this.setupTableAlarm(name, 'OnlineIndexConsumedWriteCapacity', tableConfig);
      this.setupTableAlarm(name, 'OnlineIndexPercentageProgress', tableConfig);
      this.setupTableAlarm(name, 'OnlineIndexThrottleEvents', tableConfig);
      this.setupTableAlarm(name, 'PendingReplicationCount', tableConfig);
      this.setupTableAlarm(name, 'ProvisionedReadCapacity', tableConfig);
      this.setupTableAlarm(name, 'ProvisionedWriteCapacity', tableConfig);
      this.setupTableAlarm(name, 'ReadThrottleEvents', tableConfig);
      this.setupTableAlarm(name, 'ReplicationLatency', tableConfig);
      this.setupTableAlarm(name, 'ReturnedBytes', tableConfig);
      this.setupTableAlarm(name, 'ReturnedItemCount', tableConfig);
      this.setupTableAlarm(name, 'ReturnedRecordsCount', tableConfig);
      this.setupTableAlarm(name, 'SystemErrors', tableConfig);
      this.setupTableAlarm(name, 'TimeToLiveDeletedItemCount', tableConfig);
      this.setupTableAlarm(name, 'ThrottledRequests', tableConfig);
      this.setupTableAlarm(name, 'TransactionConflict', tableConfig);
      this.setupTableAlarm(name, 'WriteThrottleEvents', tableConfig);
    });
  }

  setupTableAlarm(tableName: string, metricName: string, conf?: config.ConfigLocal): void {
    const autoResolve = config.autoResolve(config.ConfigDefaultType.Table, metricName, conf?.config);

    const metric = new cw.Metric({
      ...getMetricConfig(config.ConfigDefaultType.Table, metricName, conf?.config?.metric),
      dimensions: {
        TableName: tableName,
      },
    });

    const alarm = metric.createAlarm(this, `${tableName}-${metricName}`, {
      ...getAlarmConfig(config.ConfigDefaultType.Table, metricName, conf?.config?.alarm),
      alarmName: `${tableName}-${metricName}`,
      actionsEnabled: config.isEnabled(config.ConfigDefaultType.Table, metricName, conf?.config)
    });
    this.snsStack.addAlarmActions(alarm, autoResolve);
  }
}

// Setup table alarms
export function createDynamoDBMonitoring(stack: cdk.Stack, snsStack: NestedSNSStack): NestedTableAlarmsStack[] {
  const tables = config.getTables();
  const tableKeys: string[] = Object.keys(tables);

  // Nothing to create
  if (tableKeys.length === 0) {
    return [];
  }

  // Split over 30 tables to multiple stacks
  if (tableKeys.length > 30) {
    return chunk(tableKeys, 30).map((tableKeys, index) => {
      const stackTables = config.getSelectedTables(tableKeys);
      return new NestedTableAlarmsStack(stack, stack.stackName + '-table-alarms-' + (index + 1), snsStack, stackTables);
    });
  }

  // Create single stack
  return [new NestedTableAlarmsStack(stack, stack.stackName + '-table-alarms', snsStack, tables)];
}
