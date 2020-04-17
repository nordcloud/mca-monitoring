// Ignored due to issue with building postinstall
// @ts-ignore
import * as fs from 'fs';

import * as yaml from 'js-yaml';

/**
 * CLI config in the config file
 */
export interface ConfigCLI {
  version: number;
  profile: string;
  services: string[];
  includes: string[];
  excludes: string[];
}

export interface AlarmOptions {
  /**
   * Name of the alarm
   */
  readonly alarmName?: string;

  /**
   * Description for the alarm
   */
  readonly description?: string;

  /**
   * Comparison to use to check if metric is breaching
   */
  readonly comparisonOperator?: string;

  /**
   * The value against which the specified statistic is compared.
   */
  readonly threshold: number;

  /**
   * The number of periods over which data is compared to the specified threshold.
   */
  readonly evaluationPeriods: number;

  /**
   * Specifies whether to evaluate the data and potentially change the alarm state if there are too few data points to be statistically significant.
   *
   * Used only for alarms that are based on percentiles.
   */
  readonly evaluateLowSampleCountPercentile?: string;

  /**
   * Sets how this alarm is to handle missing data points.
   */
  readonly treatMissingData?: string;
}

export type DimensionHash = { [dim: string]: object };

/**
 * Duration values
 */
export interface MetricDuration {
  milliseconds?: number;
  seconds?: number;
  minutes?: number;
  hours?: number;
  days?: number;
  iso?: string;
}

export interface MetricOptions {
  /**
   * The period over which the specified statistic is applied.
   */
  readonly period?: MetricDuration;

  /**
   * What function to use for aggregating.
   *
   * Can be one of the following:
   *
   * - "Minimum" | "min"
   * - "Maximum" | "max"
   * - "Average" | "avg"
   * - "Sum" | "sum"
   * - "SampleCount | "n"
   * - "pNN.NN"
   */
  readonly statistic?: string;

  /**
   * Dimensions of the metric
   */
  readonly dimensions?: DimensionHash;

  /**
   * Unit used to filter the metric stream
   *
   * Only refer to datums emitted to the metric stream with the given unit and
   * ignore all others. Only useful when datums are being emitted to the same
   * metric stream under different units.
   *
   * The default is to use all matric datums in the stream, regardless of unit,
   * which is recommended in nearly all cases.
   *
   * CloudWatch does not honor this property for graphs.
   */
  readonly unit?: string;

  /**
   * Label for this metric when added to a Graph in a Dashboard
   */
  readonly label?: string;

  /**
   * Color for this metric when added to a Graph in a Dashboard
   */
  readonly color?: string;
}

export interface ConfigMetricAlarm {
  enabled?: boolean;
  autoResolve?: boolean;
  alarm?: AlarmOptions;
  metric?: MetricOptions;
}

export interface ConfigMetricAlarms {
  [key: string]: ConfigMetricAlarm;
}

export interface ConfigLocals {
  [key: string]: ConfigMetricAlarms;
}

export interface ConfigCustomDefaults {
  lambda?: ConfigMetricAlarms;
  table?: ConfigMetricAlarms;
  account?: ConfigMetricAlarms;
  cluster?: ConfigMetricAlarms;
  apiGateway?: ConfigMetricAlarms;
  cloudfront?: ConfigMetricAlarms;
}

export interface ConfigCustomSNS {
  id: string;
  name: string;
  emails?: string[];
  endpoints?: string[];
}

export interface ConfigCustom {
  default: ConfigCustomDefaults;
  snsTopic: ConfigCustomSNS;
}

export interface Config {
  cli: ConfigCLI;
  lambdas?: ConfigLocals;
  tables?: ConfigLocals;
  clusters?: ConfigLocals;
  routes?: ConfigLocals;
  distributions?: ConfigLocals;
  custom: ConfigCustom;
}

let configFile: Config | undefined;

/**
 * Get full config file
 */
export function getConfigFile(): Config | undefined {
  return configFile;
}

/**
 * Load config from string
 */
export function loadConfigString(config: string): void {
  configFile = yaml.safeLoad(config);
}

/**
 * Load config file for use
 */
export function loadConfig(configPath: string): void {
  loadConfigString(fs.readFileSync(configPath).toString());
}

/**
 * Get SNS topic from config
 */
export function configGetSNSTopic(): ConfigCustomSNS | undefined {
  return configFile?.custom?.snsTopic;
}

export enum ConfigLocalType {
  Lambda = 'lambdas',
  Table = 'tables',
  Cluster = 'clusters',
  ApiGateway = 'routes',
  Cloudfront = 'distributions',
}

export enum ConfigDefaultType {
  Table = 'table',
  Lambda = 'lambda',
  Account = 'account',
  Cluster = 'cluster',
  ApiGateway = 'apiGateway',
  Cloudfront = 'cloudfront',
}

/**
 * @internal
 *
 * Convert local config type to default config
 */
export function configLocalTypeToDefault(confType: ConfigLocalType): ConfigDefaultType | undefined {
  switch (confType) {
    case ConfigLocalType.Lambda:
      return ConfigDefaultType.Lambda;
    case ConfigLocalType.Table:
      return ConfigDefaultType.Table;
    case ConfigLocalType.Cluster:
      return ConfigDefaultType.Cluster;
    case ConfigLocalType.ApiGateway:
      return ConfigDefaultType.ApiGateway;
    case ConfigLocalType.Cloudfront:
      return ConfigDefaultType.Cloudfront;
    default:
      return undefined;
  }
}

/**
 * @internal
 *
 * Convert local config type to default config
 */
export function configDefaultTypeToLocal(confType: ConfigDefaultType): ConfigLocalType | undefined {
  switch (confType) {
    case ConfigDefaultType.Lambda:
      return ConfigLocalType.Lambda;
    case ConfigDefaultType.Table:
      return ConfigLocalType.Table;
    case ConfigDefaultType.Cluster:
      return ConfigLocalType.Cluster;
    case ConfigDefaultType.ApiGateway:
      return ConfigLocalType.ApiGateway;
    case ConfigDefaultType.Cloudfront:
      return ConfigLocalType.Cloudfront;
    default:
      return undefined;
  }
}

/**
 * Get all local values for type
 */
export function configGetAll(confType: ConfigLocalType): ConfigLocals {
  return configFile?.[confType] || {};
}

/**
 * Get single config value for type
 */
export function configGetSingle(confType: ConfigLocalType, name: string): ConfigMetricAlarms | undefined {
  return configGetAll(confType)[name];
}

/**
 * Get selected configs for type with given names
 */
export function configGetSelected(confType: ConfigLocalType, names: string[]): ConfigLocals {
  return names.reduce((acc, name) => {
    const val = configGetSingle(confType, name);
    if (val) {
      return { ...acc, [name]: val };
    }
    return acc;
  }, {});
}

/**
 * Get default configs from config file
 */
export function configGetDefault(configType: ConfigDefaultType, metricName: string): ConfigMetricAlarm | undefined {
  return configFile?.custom?.default?.[configType]?.[metricName];
}

/**
 * Check if metric is enabled for local or default config
 */
export function configIsEnabled(
  configType: ConfigDefaultType,
  metricName: string,
  localConfig?: ConfigMetricAlarms,
): boolean {
  const local = localConfig?.[metricName]?.enabled;
  if (local === false) {
    return false;
  }

  return configGetDefault(configType, metricName)?.enabled === true || local === true;
}

/**
 * Check if autoresolve is enabled for local or default config
 */
export function configAutoResolve(
  configType: ConfigDefaultType,
  metricName: string,
  localConfig?: ConfigMetricAlarms,
): boolean {
  const local = localConfig?.[metricName]?.autoResolve;
  if (local === false) {
    return false;
  }

  return configGetDefault(configType, metricName)?.autoResolve === true || local === true;
}

/**
 * Get all local values that are enabled in either local or default config
 */
export function configGetAllEnabled(confType: ConfigLocalType, metrics: string[]): ConfigLocals {
  const all = configGetAll(confType);

  return Object.keys(all).reduce((acc, key) => {
    const local = all[key];

    const defaultType = configLocalTypeToDefault(confType);
    if (defaultType) {
      // Check if any metric is enabled in default or local
      let isEnabled = false;
      for (const metricName of metrics) {
        if (configIsEnabled(defaultType, metricName, local)) {
          isEnabled = true;
          break;
        }
      }

      // Add only if at least one value is enabled
      if (isEnabled) {
        return { ...acc, [key]: local };
      }

      // Skip adding as none was enabled
      return acc;
    }

    // Add by default if local to default conversion is not supported
    return { ...acc, [key]: local };
  }, {});
}
