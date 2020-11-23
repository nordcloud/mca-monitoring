import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';
import { chunk } from '../utils/utils';

// https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Container-Insights-metrics-EKS.html
export const eksMetrics = [
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

const defaultType = config.ConfigDefaultType.EksCluster;
const localType = config.ConfigLocalType.EksCluster;

export class NestedEKSAlarmsStack extends BaseNestedStack {
  constructor(
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    clusters: config.ConfigLocals<config.ConfigMetricAlarms>,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    // Setup clusters
    Object.keys(clusters).forEach(clusterName => {
      const clusterConfig = clusters[clusterName];
      const dimensions = {
        ClusterName: clusterName,
      };

      eksMetrics.forEach(metricName => {
        if (clusterConfig[metricName]) {
          this.setupAlarm(clusterName, metricName, clusterConfig[metricName], dimensions);
        }
      });
    });
  }
}

// Setup eks alarms
export function createEKSMonitoring(stack: cdk.Stack, snsStack: NestedSNSStack): NestedEKSAlarmsStack[] {
  const clusters = config.configGetAllEnabled(localType, eksMetrics);
  const clusterKeys: string[] = Object.keys(clusters);

  // Nothing to create
  if (clusterKeys.length === 0) {
    return [];
  }

  // Split over 8 clusters to multiple stacks
  if (clusterKeys.length > 8) {
    return chunk(clusterKeys, 8).map((keys, index) => {
      const stackClusters = config.configGetSelected(localType, keys);
      return new NestedEKSAlarmsStack(
        stack,
        stack.stackName + '-eks-cluster-alarms-' + (index + 1),
        snsStack,
        stackClusters,
      );
    });
  }

  // Create single stack
  return [new NestedEKSAlarmsStack(stack, stack.stackName + '-eks-cluster-alarms', snsStack, clusters)];
}
