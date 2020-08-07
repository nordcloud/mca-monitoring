import { Unit, TreatMissingData, ComparisonOperator, Statistic } from '@aws-cdk/aws-cloudwatch';
import { NestedSNSStack } from '../stacks';

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
  readonly comparisonOperator?: ComparisonOperator;

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
  readonly treatMissingData?: TreatMissingData;
}

export type DimensionHash = { [dim: string]: object };

export enum MetricNamespace {
  Lambda = 'AWS/Lambda',
  DynamoDB = 'AWS/DynamoDB',
  ECS = 'AWS/ECS',
  ApiGateway = 'AWS/ApiGateway',
  CloudFront = 'AWS/CloudFront',
  RDS = 'AWS/RDS',
  EKS = 'AWS/EKS',
}

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
  readonly statistic?: Statistic;

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
  readonly unit?: Unit;

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

export interface ConfigMetricAlarmName extends ConfigMetricAlarm {
  metricName: string;
  resourceName: string;
}

export interface ConfigSNS {
  id: string;
  name: string;
  emails?: string[];
  endpoints?: string[];
}

export interface MonitoringLocalConfig<T> {
  [key: string]: T;
}

export interface MonitoringConfig<T> {
  default: T;
  local?: MonitoringLocalConfig<T>;
  exclude?: string[];
  include?: string[];
  snsStack?: NestedSNSStack;
}

export interface MonitoringConfigNoLocal<T> {
  default: T;
  exclude?: string[];
  include?: string[];
  snsStack?: NestedSNSStack;
}
