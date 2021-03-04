import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';

export const clusterMetrics = [
  'CPUReservation',
  'CPUUtilization',
  'MemoryReservation',
  'MemoryUtilization',
  'GPUReservation',
];

const defaultType = config.ConfigDefaultType.Cluster;
const localType = config.ConfigLocalType.Cluster;

export class NestedClusterAlarmsStack extends BaseNestedStack {
  constructor(
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    clusters: config.ConfigLocals<config.ConfigMetricAlarms>,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    Object.keys(clusters).forEach(name => {
      const clusterConf = clusters[name];
      const dimensions = {
        ClusterName: name,
      };

      clusterMetrics.forEach(metricName => {
        if (clusterConf[metricName]) {
          this.setupAlarm(name, metricName, clusterConf[metricName], dimensions);
        }
      });
    });
  }
}

export function createClusterAlarms(stack: cdk.Stack, snsStack: NestedSNSStack, versionReportingEnabled = true): NestedClusterAlarmsStack[] {
  return config.chunkByStackLimit(localType, clusterMetrics, 0, versionReportingEnabled).map((stackClusters, index) => {
    return new NestedClusterAlarmsStack(
      stack,
      stack.stackName + '-cluster-alarms-' + (index + 1),
      snsStack,
      stackClusters,
    );
  });
}
