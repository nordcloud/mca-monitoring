import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';
import { chunk } from '../utils/utils';

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
    clusters: config.ConfigLocals,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    Object.keys(clusters).forEach(name => {
      const clusterConf = clusters[name];
      const dimensions = {
        ClusterName: name,
      };

      clusterMetrics.forEach(metricName => {
        this.setupAlarm(name, metricName, clusterConf, dimensions);
      });
    });
  }
}

export function createClusterAlarms(stack: cdk.Stack, snsStack: NestedSNSStack): NestedClusterAlarmsStack[] {
  const clusters = config.configGetAllEnabled(localType, clusterMetrics);
  const keys = Object.keys(clusters);

  if (keys.length === 0) {
    return [];
  }

  if (keys.length > 30) {
    return chunk(keys, 30).map((keys, index) => {
      const clusters = config.configGetSelected(localType, keys);
      return new NestedClusterAlarmsStack(
        stack,
        stack.stackName + '-cluster-alarms-' + (index + 1),
        snsStack,
        clusters,
      );
    });
  }

  return [new NestedClusterAlarmsStack(stack, stack.stackName + '-cluster-alarms', snsStack, clusters)];
}
