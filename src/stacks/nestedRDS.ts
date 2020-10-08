import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';
import { chunk } from '../utils/utils';

// From https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/MonitoringOverview.html
export const rdsMetrics = [
  'BinLogDiskUsage',
  'BurstBalance',
  'CPUUtilization',
  'CPUCreditUsage',
  'CPUCreditBalance',
  'DatabaseConnections',
  'DiskQueueDepth',
  'FailedSQLServerAgentJobsCount',
  'FreeableMemory',
  'FreeStorageSpace',
  'MaximumUsedTransactionIDs',
  'NetworkReceiveThroughput',
  'NetworkTransmitThroughput',
  'OldestReplicationSlotLag',
  'ReadIOPS',
  'ReadLatency',
  'ReadThroughput',
  'ReplicaLag',
  'ReplicationSlotDiskUsage',
  'SwapUsage',
  'TransactionLogsDiskUsage',
  'TransactionLogsGeneration',
  'WriteIOPS',
  'WriteLatency',
  'WriteThroughput',
];

const defaultType = config.ConfigDefaultType.RdsInstance;
const localType = config.ConfigLocalType.RdsInstance;

export class NestedRDSAlarmsStack extends BaseNestedStack {
  constructor(
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    instances: config.ConfigLocals<config.ConfigMetricAlarms>,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    // Setup instances
    Object.keys(instances).forEach(instanceName => {
      const instanceConfig = instances[instanceName];
      const dimensions = {
        DBInstanceIdentifier: instanceName,
      };

      rdsMetrics.forEach(metricName => {
        if (instanceConfig[metricName]) {
          this.setupAlarm(instanceName, metricName, instanceConfig[metricName], dimensions);
        }
      });
    });
  }
}

// Setup rds alarms
export function createRDSMonitoring(stack: cdk.Stack, snsStack: NestedSNSStack): NestedRDSAlarmsStack[] {
  const instances = config.configGetAllEnabled(localType, rdsMetrics);
  const instanceKeys: string[] = Object.keys(instances);

  // Nothing to create
  if (instanceKeys.length === 0) {
    return [];
  }

  // Split over 7 instances to multiple stacks
  if (instanceKeys.length > 7) {
    return chunk(instanceKeys, 7).map((keys, index) => {
      const stackInstances = config.configGetSelected(localType, keys);
      return new NestedRDSAlarmsStack(
        stack,
        stack.stackName + '-rds-instance-alarms-' + (index + 1),
        snsStack,
        stackInstances,
      );
    });
  }

  // Create single stack
  return [new NestedRDSAlarmsStack(stack, stack.stackName + '-rds-instance-alarms', snsStack, instances)];
}
