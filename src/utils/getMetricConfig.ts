import { MetricProps } from '@aws-cdk/aws-cloudwatch';

import { MetricNamespace, MetricOptions } from './types';

export default function getMetricConfig(
  metricName: string,
  namespace: MetricNamespace,
  props?: MetricOptions,
): MetricProps {
  return {
    ...(props || {}),

    // To make sure these are not overriden by config
    metricName,
    namespace,
  } as MetricProps;
}
