import { ConfigMetricAlarm } from './types';

/**
 * Check if metric is enabled for local or default config
 *
 * Enabled value must be set to true. Missing value is by default false
 */
export default function isEnabled(defaultConfig?: ConfigMetricAlarm, localConfig?: ConfigMetricAlarm): boolean {
  const local = localConfig?.enabled;
  if (local === false) {
    return false;
  }

  return defaultConfig?.enabled === true || local === true;
}
