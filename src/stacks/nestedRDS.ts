import * as cdk from '@aws-cdk/core';

import BaseNestedStack, { BaseNestedStackProps } from './baseNestedStack';
import { isEnabled, generateMetricAlarm, chunk, MetricNamespace } from '../utils';
import { MonitoringConfig, ConfigMetricAlarm, ConfigMetricAlarmName } from '../utils/types';
import { getRDSInstances } from '../aws-sdk';

export interface RDSConfigProps {
  BinLogDiskUsage?: ConfigMetricAlarm;
  BurstBalance?: ConfigMetricAlarm;
  CPUUtilization?: ConfigMetricAlarm;
  CPUCreditUsage?: ConfigMetricAlarm;
  CPUCreditBalance?: ConfigMetricAlarm;
  DatabaseConnections?: ConfigMetricAlarm;
  DiskQueueDepth?: ConfigMetricAlarm;
  FailedSQLServerAgentJobsCount?: ConfigMetricAlarm;
  FreeableMemory?: ConfigMetricAlarm;
  FreeStorageSpace?: ConfigMetricAlarm;
  MaximumUsedTransactionIDs?: ConfigMetricAlarm;
  NetworkReceiveThroughput?: ConfigMetricAlarm;
  NetworkTransmitThroughput?: ConfigMetricAlarm;
  OldestReplicationSlotLag?: ConfigMetricAlarm;
  ReadIOPS?: ConfigMetricAlarm;
  ReadLatency?: ConfigMetricAlarm;
  ReadThroughput?: ConfigMetricAlarm;
  ReplicaLag?: ConfigMetricAlarm;
  ReplicationSlotDiskUsage?: ConfigMetricAlarm;
  SwapUsage?: ConfigMetricAlarm;
  TransactionLogsDiskUsage?: ConfigMetricAlarm;
  TransactionLogsGeneration?: ConfigMetricAlarm;
  WriteIOPS?: ConfigMetricAlarm;
  WriteLatency?: ConfigMetricAlarm;
  WriteThroughput?: ConfigMetricAlarm;
}

export type RDSProps = MonitoringConfig<RDSConfigProps>;

export type RDSPropsKeys = (keyof RDSConfigProps)[];

// From https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/MonitoringOverview.html
export const rdsMetrics: RDSPropsKeys = [
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

export interface NestedRDSAlarmStackProps extends BaseNestedStackProps {
  metricAlarms: ConfigMetricAlarmName[];
}

// Generate nested stack for lambda alarms
export class NestedRDSAlarmsStack extends BaseNestedStack {
  constructor(scope: cdk.Construct, id: string, props: NestedRDSAlarmStackProps) {
    super(scope, id, props);

    props.metricAlarms.forEach(metricAlarm => {
      const dimensions = {
        DBInstanceIdentifier: metricAlarm.resourceName,
      };

      this.setupAlarm(metricAlarm, MetricNamespace.RDS, dimensions);
    });
  }
}

// Setup rds alarms
export async function createRDSMonitoring(stack: cdk.Stack, props?: RDSProps): Promise<NestedRDSAlarmsStack[]> {
  const instances = await getRDSInstances(props?.include, props?.exclude);
  const metricAlarms: ConfigMetricAlarmName[] = [];

  instances.forEach(instance => {
    rdsMetrics.forEach(metric => {
      const defaultConf = props?.default?.[metric];
      const localConf = props?.local?.[instance.DBInstanceIdentifier || '']?.[metric];
      if (isEnabled(defaultConf, localConf)) {
        metricAlarms.push(generateMetricAlarm(metric, instance.DBInstanceIdentifier, defaultConf, localConf));
      }
    });
  });

  if (metricAlarms.length === 0) {
    return [];
  }

  // Split more than 50 lambdas to multiple stacks
  if (metricAlarms.length > 7) {
    return chunk(metricAlarms, 7).map((metricAlarms, index) => {
      return new NestedRDSAlarmsStack(stack, stack.stackName + '-rds-instance-alarms-' + (index + 1), {
        snsStack: props?.snsStack,
        metricAlarms,
      });
    });
  }

  // Create single stack
  return [
    new NestedRDSAlarmsStack(stack, stack.stackName + '-rds-instance-alarms', {
      snsStack: props?.snsStack,
      metricAlarms,
    }),
  ];
}
