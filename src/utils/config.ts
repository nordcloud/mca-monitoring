// Ignored due to issue with building postinstall
// @ts-ignore
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import deepMerge from 'deepmerge';

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
   * Enable alarm
   */
  readonly enabled?: boolean;

  /**
   * Autoresolve alarm
   */
  readonly autoResolve?: boolean;

  /**
   * Name of the alarm
   */
  readonly alarmName?: string;

  /**
   * Description for the alarm
   */
  readonly alarmDescription?: string;

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

export interface MetricFilterOptions {
  pattern?: string;
}

export interface TopicMap<T> {
  [topic: string]: T;
}

export interface ConfigMetricAlarm<T = AlarmOptions, K = MetricOptions> {
  enabled?: boolean;
  autoResolve?: boolean;
  alarm?: TopicMap<T>;
  metric?: K;
}

export interface ConfigMetricAlarms<T = AlarmOptions, K = MetricOptions> {
  [key: string]: ConfigMetricAlarm<T, K>;
}

export interface ConfigLogGroupAlarm extends ConfigMetricAlarm {
  filter?: MetricFilterOptions;
}

export interface ConfigLogGroupAlarms {
  [key: string]: ConfigLogGroupAlarm;
}

export interface ConfigLocals<T> {
  [key: string]: T;
}

export interface ConfigCustomDefaults {
  lambda?: ConfigMetricAlarms;
  table?: ConfigMetricAlarms;
  account?: ConfigMetricAlarms;
  cluster?: ConfigMetricAlarms;
  apiGateway?: ConfigMetricAlarms;
  cloudfront?: ConfigMetricAlarms;
  rds?: ConfigMetricAlarms;
  eks?: ConfigMetricAlarms;
  logGroup?: ConfigLogGroupAlarms;
}

export interface ConfigCustomSNS {
  id: string;
  name: string;
  emails?: string[];
  endpoints?: string[];
  slackWebhook?: string;
}

export interface ConfigCustomBillingAlert {
  enabled: boolean;
  limit: number;
}

export interface ConfigCustom {
  default: ConfigCustomDefaults;
  snsTopic: TopicMap<ConfigCustomSNS>;
  billingAlert: ConfigCustomBillingAlert;
}

export interface Config {
  cli: ConfigCLI;
  custom: ConfigCustom;
  lambdas?: ConfigLocals<ConfigMetricAlarms>;
  tables?: ConfigLocals<ConfigMetricAlarms>;
  clusters?: ConfigLocals<ConfigMetricAlarms>;
  routes?: ConfigLocals<ConfigMetricAlarms>;
  distributions?: ConfigLocals<ConfigMetricAlarms>;
  rdsInstances?: ConfigLocals<ConfigMetricAlarms>;
  eksClusters?: ConfigLocals<ConfigMetricAlarms>;
  logGroups?: ConfigLocals<ConfigLogGroupAlarms>;
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
  configFile = yaml.safeLoad(config) as Config;
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
export function configGetSNSTopics(): TopicMap<ConfigCustomSNS> | undefined {
  return configFile?.custom?.snsTopic;
}

export function configGetBillingAlert(): ConfigCustomBillingAlert | undefined {
  return configFile?.custom?.billingAlert;
}

export enum ConfigLocalType {
  Lambda = 'lambdas',
  Table = 'tables',
  Cluster = 'clusters',
  ApiGateway = 'routes',
  Cloudfront = 'distributions',
  RdsInstance = 'rdsInstances',
  EksCluster = 'eksClusters',
  LogGroup = 'logGroups',
}

export enum ConfigDefaultType {
  Table = 'table',
  Lambda = 'lambda',
  Account = 'account',
  Cluster = 'cluster',
  ApiGateway = 'apiGateway',
  Cloudfront = 'cloudfront',
  RdsInstance = 'rds',
  EksCluster = 'eks',
  LogGroup = 'logGroup',
}

/**
 * @internal
 *
 * Convert local config type to default config
 */
export function configLocalTypeToDefault(confType: ConfigLocalType): ConfigDefaultType {
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
    case ConfigLocalType.RdsInstance:
      return ConfigDefaultType.RdsInstance;
    case ConfigLocalType.EksCluster:
      return ConfigDefaultType.EksCluster;
    case ConfigLocalType.LogGroup:
      return ConfigDefaultType.LogGroup;
    default:
      return ConfigDefaultType.LogGroup;
  }
}

/**
 * @internal
 *
 * Convert local config type to default config
 */
export function configDefaultTypeToLocal(confType: ConfigDefaultType): ConfigLocalType {
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
    case ConfigDefaultType.RdsInstance:
      return ConfigLocalType.RdsInstance;
    case ConfigDefaultType.EksCluster:
      return ConfigLocalType.EksCluster;
    case ConfigDefaultType.LogGroup:
      return ConfigLocalType.LogGroup;
    default:
      return ConfigLocalType.LogGroup;
  }
}

/**
 * Get all default configs from config file
 */
export function configGetAllDefaults<T extends ConfigMetricAlarms = ConfigMetricAlarms>(
  configType: ConfigDefaultType,
): T | undefined {
  return configFile?.custom?.default?.[configType] as T | undefined;
}

/**
 * Get default configs from config file
 */
export function configGetDefault<T extends ConfigMetricAlarms = ConfigMetricAlarms>(
  configType: ConfigDefaultType,
  metricName: string,
): T | undefined {
  return configGetAllDefaults(configType)?.[metricName] as T | undefined;
}

/**
 * Get all local values for type
 */
export function configGetAll<T extends ConfigMetricAlarms = ConfigMetricAlarms>(
  confType: ConfigLocalType,
): ConfigLocals<T> {
  const defaults = configGetAllDefaults(configLocalTypeToDefault(confType));
  if (defaults) {
    const conf = configFile?.[confType];
    if (conf) {
      const keys = Object.keys(conf);
      return keys.reduce((acc, key) => {
        return {
          ...acc,
          [key]: deepMerge(defaults, conf[key]),
        } as ConfigLocals<T>;
      }, {} as ConfigLocals<T>);
    }
    return {};
  }

  return (configFile?.[confType] || {}) as ConfigLocals<T>;
}

/**
 * Get single config value for type
 */
export function configGetSingle<T extends ConfigMetricAlarms = ConfigMetricAlarms>(
  confType: ConfigLocalType,
  name: string,
): T | undefined {
  const defaults = configGetAllDefaults(configLocalTypeToDefault(confType));
  if (defaults) {
    const conf = configFile?.[confType]?.[name];
    if (conf) {
      return deepMerge(defaults, conf) as T;
    }
    return undefined;
  }

  return configFile?.[confType]?.[name] as T | undefined;
}

/**
 * Get selected configs for type with given names
 */
export function configGetSelected<T extends ConfigMetricAlarms = ConfigMetricAlarms>(
  confType: ConfigLocalType,
  names: string[],
): ConfigLocals<T> {
  return names.reduce((acc, name) => {
    const val = configGetSingle(confType, name);
    if (val) {
      return { ...acc, [name]: val };
    }
    return acc;
  }, {});
}

interface EnabledConfig {
  enabled?: boolean;
  alarm?: TopicMap<{ enabled?: boolean }>;
}

/**
 * Check if config has either local or global enabled
 */
export function configIsEnabled<T extends EnabledConfig>(config: T): boolean {
  // Check global setting first
  if (config.enabled !== false) {
    return true;
  }

  // Check local alarm settings
  return Object.values(config.alarm || {}).find(l => l.enabled === true) !== undefined;
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
export function configGetAllEnabled<T extends ConfigMetricAlarms = ConfigMetricAlarms>(
  confType: ConfigLocalType,
  metrics: string[],
): ConfigLocals<T> {
  const all = configGetAll(confType);

  return Object.keys(all).reduce((acc, key) => {
    const locals = all[key];

    if (!locals) {
      return acc;
    }

    const isEnabled = Object.keys(locals).find(key => {
      if (!metrics.includes(key)) {
        return false;
      }
      const local = locals[key];
      return local.enabled !== false || Object.values(local.alarm || {}).find(l => l.enabled !== false);
    });

    // Add only if at least one value is enabled
    if (isEnabled) {
      return { ...acc, [key]: locals };
    }

    // Skip adding as none was enabled
    return acc;
  }, {});
}
