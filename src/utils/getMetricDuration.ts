import { Duration } from '@aws-cdk/core';
import { MetricDuration } from './types';

export default function getMetricDuration(conf?: MetricDuration): Duration {
  const defaultDuration = Duration.minutes(5);

  if (!conf) {
    return defaultDuration;
  }

  if (conf.milliseconds) {
    return Duration.millis(conf.milliseconds);
  }
  if (conf.seconds) {
    return Duration.seconds(conf.seconds);
  }
  if (conf.minutes) {
    return Duration.minutes(conf.minutes);
  }
  if (conf.hours) {
    return Duration.hours(conf.hours);
  }
  if (conf.days) {
    return Duration.days(conf.days);
  }
  if (conf.iso) {
    return Duration.parse(conf.iso);
  }

  // Default value
  return defaultDuration;
}
