import { MetricProps } from '@aws-cdk/aws-cloudwatch';

import { MetricNamespace, MetricOptions } from './types';
import getMetricUnit from './getMetricUnit';
import getMetricDuration from './getMetricDuration';

export default function getMetricConfig(
  metricName: string,
  namespace: MetricNamespace,
  props?: MetricOptions,
): MetricProps {
  return {
    ...(props || {}),
    unit: getMetricUnit(props?.unit),
    period: getMetricDuration(props?.period),

    // To make sure these are not overriden by config
    metricName,
    namespace,
  } as MetricProps;
}
