import * as config from './config';

export function getMetricFilterConfig(
  configType: config.ConfigDefaultType,
  metricName: string,
  conf?: config.ConfigLogGroupAlarms,
): config.MetricFilterOptions {
  const combined = {
    ...((config.configGetDefault(configType, metricName) as config.ConfigLogGroupAlarm)?.filter || {}),
    ...(conf?.[metricName]?.filter || {}),
  };

  return combined;
}
