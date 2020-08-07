import { ConfigMetricAlarm, ConfigMetricAlarmName } from './types';

import isAutoresolved from './isAutoresolved';

/**
 * Generate metric alarm config
 */
export default function generateMetricAlarm(
  metricName: string,
  resourceName?: string,
  defaultConfig?: ConfigMetricAlarm,
  localConfig?: ConfigMetricAlarm,
): ConfigMetricAlarmName {
  return {
    metricName,
    resourceName: resourceName || '',
    enabled: true,
    autoResolve: isAutoresolved(defaultConfig, localConfig),
    alarm: {
      threshold: 100,
      evaluationPeriods: 300,
      ...(defaultConfig?.alarm || {}),
      ...(localConfig?.alarm || {}),
    },
    metric: {
      ...(defaultConfig?.metric || {}),
      ...(localConfig?.metric || {}),
    },
  };
}
