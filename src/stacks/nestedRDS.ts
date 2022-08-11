import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';

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
    scope: Construct,
    id: string,
    snsStack: NestedSNSStack,
    instances: config.ConfigLocals<config.ConfigMetricAlarms>,
    props?: cdk.NestedStackProps,
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
export function createRDSMonitoring(stack: cdk.Stack, snsStack: NestedSNSStack, versionReportingEnabled = true): NestedRDSAlarmsStack[] {
  return config.chunkByStackLimit(localType, rdsMetrics, 0, versionReportingEnabled).map((stackInstances, index) => {
    return new NestedRDSAlarmsStack(
      stack,
      stack.stackName + '-rds-instance-alarms-' + (index + 1),
      snsStack,
      stackInstances,
    );
  });
}
