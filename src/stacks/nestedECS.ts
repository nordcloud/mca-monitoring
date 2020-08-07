import * as cdk from '@aws-cdk/core';

import BaseNestedStack, { BaseNestedStackProps } from './baseNestedStack';
import { isEnabled, generateMetricAlarm, chunk, MetricNamespace } from '../utils';
import { MonitoringConfig, ConfigMetricAlarm, ConfigMetricAlarmName } from '../utils/types';
import { getECSClusters } from '../aws-sdk';

export interface ECSConfigProps {
  CPUReservation?: ConfigMetricAlarm;
  CPUUtilization?: ConfigMetricAlarm;
  MemoryReservation?: ConfigMetricAlarm;
  MemoryUtilization?: ConfigMetricAlarm;
  GPUReservation?: ConfigMetricAlarm;
}

export type ECSProps = MonitoringConfig<ECSConfigProps>;

export type ECSPropsKeys = (keyof ECSConfigProps)[];

export const ecsMetrics: ECSPropsKeys = [
  'CPUReservation',
  'CPUUtilization',
  'MemoryReservation',
  'MemoryUtilization',
  'GPUReservation',
];

export interface NestedECSAlarmStackProps extends BaseNestedStackProps {
  metricAlarms: ConfigMetricAlarmName[];
}

export class NestedECSAlarmsStack extends BaseNestedStack {
  constructor(scope: cdk.Construct, id: string, props: NestedECSAlarmStackProps) {
    super(scope, id, props);

    props.metricAlarms.forEach(metricAlarm => {
      const dimensions = {
        ClusterName: metricAlarm.resourceName,
      };

      this.setupAlarm(metricAlarm, MetricNamespace.ECS, dimensions);
    });
  }
}

export async function createECSMonitoring(stack: cdk.Stack, props?: ECSProps): Promise<NestedECSAlarmsStack[]> {
  const clusters = await getECSClusters(props?.include, props?.exclude);
  const metricAlarms: ConfigMetricAlarmName[] = [];

  clusters.forEach(cluster => {
    ecsMetrics.forEach(metric => {
      const defaultConf = props?.default?.[metric];
      const localConf = props?.local?.[cluster.clusterName || '']?.[metric];
      if (isEnabled(defaultConf, localConf)) {
        metricAlarms.push(generateMetricAlarm(metric, cluster.clusterName, defaultConf, localConf));
      }
    });
  });

  if (metricAlarms.length === 0) {
    return [];
  }

  // Split more than 50 lambdas to multiple stacks
  if (metricAlarms.length > 50) {
    return chunk(metricAlarms, 50).map((metricAlarms, index) => {
      return new NestedECSAlarmsStack(stack, stack.stackName + '-ecs-cluster-alarms-' + (index + 1), {
        snsStack: props?.snsStack,
        metricAlarms,
      });
    });
  }

  // Create single stack
  return [
    new NestedECSAlarmsStack(stack, stack.stackName + '-ecs-cluster-alarms', {
      snsStack: props?.snsStack,
      metricAlarms,
    }),
  ];
}
