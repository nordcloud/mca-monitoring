import * as cdk from '@aws-cdk/core';
import * as cw from '@aws-cdk/aws-cloudwatch';

import * as config from './config';

export function getUnit(str?: string): cw.Unit | undefined {
  if (!str) {
    return undefined;
  }

  switch (str.toUpperCase()) {
    case 'SECONDS':
      return cw.Unit.SECONDS;
    case 'MICROSECONDS':
      return cw.Unit.MICROSECONDS;
    case 'MILLISECONDS':
      return cw.Unit.MILLISECONDS;
    case 'BYTES':
      return cw.Unit.BYTES;
    case 'KILOBYTES':
      return cw.Unit.KILOBYTES;
    case 'MEGABYTES':
      return cw.Unit.MEGABYTES;
    case 'GIGABYTES':
      return cw.Unit.GIGABYTES;
    case 'TERABYTES':
      return cw.Unit.TERABYTES;
    case 'BITS':
      return cw.Unit.BITS;
    case 'KILOBITS':
      return cw.Unit.KILOBITS;
    case 'MEGABITS':
      return cw.Unit.MEGABITS;
    case 'GIGABITS':
      return cw.Unit.GIGABITS;
    case 'TERABITS':
      return cw.Unit.TERABITS;
    case 'PERCENT':
      return cw.Unit.PERCENT;
    case 'COUNT':
      return cw.Unit.COUNT;
    case 'BYTES_PER_SECOND':
      return cw.Unit.BYTES_PER_SECOND;
    case 'KILOBYTES_PER_SECOND':
      return cw.Unit.KILOBYTES_PER_SECOND;
    case 'MEGABYTES_PER_SECOND':
      return cw.Unit.MEGABYTES_PER_SECOND;
    case 'GIGABYTES_PER_SECOND':
      return cw.Unit.GIGABYTES_PER_SECOND;
    case 'TERABYTES_PER_SECOND':
      return cw.Unit.TERABYTES_PER_SECOND;
    case 'BITS_PER_SECOND':
      return cw.Unit.BITS_PER_SECOND;
    case 'KILOBITS_PER_SECOND':
      return cw.Unit.KILOBITS_PER_SECOND;
    case 'MEGABITS_PER_SECOND':
      return cw.Unit.MEGABITS_PER_SECOND;
    case 'GIGABITS_PER_SECOND':
      return cw.Unit.GIGABITS_PER_SECOND;
    case 'TERABITS_PER_SECOND':
      return cw.Unit.TERABITS_PER_SECOND;
    case 'COUNT_PER_SECOND':
      return cw.Unit.COUNT_PER_SECOND;
    default:
      return cw.Unit.NONE;
  }
}

export function getDuration(conf?: config.MetricDuration): cdk.Duration {
  const defaultDuration = cdk.Duration.minutes(5);

  if (!conf) {
    return defaultDuration;
  }

  if (conf.milliseconds) {
    return cdk.Duration.millis(conf.milliseconds);
  }
  if (conf.seconds) {
    return cdk.Duration.seconds(conf.seconds);
  }
  if (conf.minutes) {
    return cdk.Duration.minutes(conf.minutes);
  }
  if (conf.hours) {
    return cdk.Duration.hours(conf.hours);
  }
  if (conf.days) {
    return cdk.Duration.days(conf.days);
  }
  if (conf.iso) {
    return cdk.Duration.parse(conf.iso);
  }

  // Default value
  return defaultDuration;
}

export function defaultConfigToNameSpace(conf: config.ConfigDefaultType): string {
  switch (conf) {
    case config.ConfigDefaultType.Lambda:
      return 'AWS/Lambda';
    case config.ConfigDefaultType.Table:
      return 'AWS/DynamoDB';
    case config.ConfigDefaultType.Account:
      return 'AWS/DynamoDB';
    case config.ConfigDefaultType.Cluster:
      return 'AWS/ECS';
    case config.ConfigDefaultType.ApiGateway:
      return 'AWS/ApiGateway';
    case config.ConfigDefaultType.Cloudfront:
      return 'AWS/CloudFront';
    case config.ConfigDefaultType.RdsInstance:
      return 'AWS/RDS';
    case config.ConfigDefaultType.EksCluster:
      return 'AWS/EKS';
    case config.ConfigDefaultType.LogGroup:
      return 'Custom';
  }
}
