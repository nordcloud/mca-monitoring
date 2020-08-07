import * as cdk from '@aws-cdk/core';

import BaseNestedStack, { BaseNestedStackProps } from './baseNestedStack';
import { isEnabled, generateMetricAlarm, chunk, MetricNamespace } from '../utils';
import { MonitoringConfig, ConfigMetricAlarm, ConfigMetricAlarmName } from '../utils/types';
import { getEKSClusters } from '../aws-sdk';

export interface EKSConfigProps {
  cluster_failed_node_count: ConfigMetricAlarm;
  cluster_node_count: ConfigMetricAlarm;
  namespace_number_of_running_pods: ConfigMetricAlarm;
  node_cpu_limit: ConfigMetricAlarm;
  node_cpu_reserved_capacity: ConfigMetricAlarm;
  node_cpu_usage_total: ConfigMetricAlarm;
  node_cpu_utilization: ConfigMetricAlarm;
  node_filesystem_utilization: ConfigMetricAlarm;
  node_memory_limit: ConfigMetricAlarm;
  node_memory_reserved_capacity: ConfigMetricAlarm;
  node_memory_utilization: ConfigMetricAlarm;
  node_memory_working_set: ConfigMetricAlarm;
  node_network_total_bytes: ConfigMetricAlarm;
  node_number_of_running_containers: ConfigMetricAlarm;
  node_number_of_running_pods: ConfigMetricAlarm;
  pod_cpu_reserved_capacity: ConfigMetricAlarm;
  pod_cpu_utilization: ConfigMetricAlarm;
  pod_cpu_utilization_over_pod_limit: ConfigMetricAlarm;
  pod_memory_reserved_capacity: ConfigMetricAlarm;
  pod_memory_utilization: ConfigMetricAlarm;
  pod_memory_utilization_over_pod_limit: ConfigMetricAlarm;
  pod_number_of_container_restarts: ConfigMetricAlarm;
  pod_network_rx_bytes: ConfigMetricAlarm;
  pod_network_tx_bytes: ConfigMetricAlarm;
  service_number_of_running_pods: ConfigMetricAlarm;
}

export type EKSProps = MonitoringConfig<EKSConfigProps>;

export type EKSPropsKeys = (keyof EKSConfigProps)[];

// https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Container-Insights-metrics-EKS.html
export const eksMetrics: EKSPropsKeys = [
  'cluster_failed_node_count',
  'cluster_node_count',
  'namespace_number_of_running_pods',
  'node_cpu_limit',
  'node_cpu_reserved_capacity',
  'node_cpu_usage_total',
  'node_cpu_utilization',
  'node_filesystem_utilization',
  'node_memory_limit',
  'node_memory_reserved_capacity',
  'node_memory_utilization',
  'node_memory_working_set',
  'node_network_total_bytes',
  'node_number_of_running_containers',
  'node_number_of_running_pods',
  'pod_cpu_reserved_capacity',
  'pod_cpu_utilization',
  'pod_cpu_utilization_over_pod_limit',
  'pod_memory_reserved_capacity',
  'pod_memory_utilization',
  'pod_memory_utilization_over_pod_limit',
  'pod_number_of_container_restarts',
  'pod_network_rx_bytes',
  'pod_network_tx_bytes',
  'service_number_of_running_pods',
];

export interface NestedEKSAlarmStackProps extends BaseNestedStackProps {
  metricAlarms: ConfigMetricAlarmName[];
}

export class NestedEKSAlarmsStack extends BaseNestedStack {
  constructor(scope: cdk.Construct, id: string, props: NestedEKSAlarmStackProps) {
    super(scope, id, props);

    props.metricAlarms.forEach(metricAlarm => {
      const dimensions = {
        ClusterName: metricAlarm.resourceName,
      };

      this.setupAlarm(metricAlarm, MetricNamespace.EKS, dimensions);
    });
  }
}

export async function createEKSMonitoring(stack: cdk.Stack, props?: EKSProps): Promise<NestedEKSAlarmsStack[]> {
  const clusters = await getEKSClusters(props?.include, props?.exclude);
  const metricAlarms: ConfigMetricAlarmName[] = [];

  clusters.forEach(cluster => {
    eksMetrics.forEach(metric => {
      const defaultConf = props?.default?.[metric];
      const localConf = props?.local?.[cluster]?.[metric];
      if (isEnabled(defaultConf, localConf)) {
        metricAlarms.push(generateMetricAlarm(metric, cluster, defaultConf, localConf));
      }
    });
  });

  if (metricAlarms.length === 0) {
    return [];
  }

  // Split more than 50 lambdas to multiple stacks
  if (metricAlarms.length > 50) {
    return chunk(metricAlarms, 50).map((metricAlarms, index) => {
      return new NestedEKSAlarmsStack(stack, stack.stackName + '-eks-cluster-alarms-' + (index + 1), {
        snsStack: props?.snsStack,
        metricAlarms,
      });
    });
  }

  // Create single stack
  return [
    new NestedEKSAlarmsStack(stack, stack.stackName + '-eks-cluster-alarms', {
      snsStack: props?.snsStack,
      metricAlarms,
    }),
  ];
}
