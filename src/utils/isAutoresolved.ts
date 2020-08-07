import { ConfigMetricAlarm } from './types';

/**
 * Check if autoresolve is enabled for local or default config
 *
 * Enabled value must be set to true. Missing value is by default false
 */
export default function isAutoresolved(defaultConfig?: ConfigMetricAlarm, localConfig?: ConfigMetricAlarm): boolean {
  const local = localConfig?.autoResolve;
  if (local === false) {
    return false;
  }

  return defaultConfig?.autoResolve === true || local === true;
}
