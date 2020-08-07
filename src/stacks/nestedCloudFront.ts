import * as cdk from '@aws-cdk/core';

import BaseNestedStack, { BaseNestedStackProps } from './baseNestedStack';
import { isEnabled, generateMetricAlarm, chunk, MetricNamespace } from '../utils';
import { MonitoringConfig, ConfigMetricAlarm, ConfigMetricAlarmName } from '../utils/types';
import { getDistributions } from '../aws-sdk';

export interface CloudFrontConfigProps {
  '4XXErrorRate': ConfigMetricAlarm;
  '5XXErrorRate': ConfigMetricAlarm;
  '401ErrorRate': ConfigMetricAlarm;
  '403ErrorRate': ConfigMetricAlarm;
  '404ErrorRate': ConfigMetricAlarm;
  '502ErrorRate': ConfigMetricAlarm;
  '503ErrorRate': ConfigMetricAlarm;
  '504ErrorRate': ConfigMetricAlarm;
  BytesDownloaded: ConfigMetricAlarm;
  BytesUploaded: ConfigMetricAlarm;
  CacheHitRate: ConfigMetricAlarm;
  OriginLatency: ConfigMetricAlarm;
  Requests: ConfigMetricAlarm;
  TotalErrorRate: ConfigMetricAlarm;
}

export type CloudFrontProps = MonitoringConfig<CloudFrontConfigProps>;

export type CloudFrontPropsKeys = (keyof CloudFrontConfigProps)[];

export const cloudFrontMetrics: CloudFrontPropsKeys = [
  '4XXErrorRate',
  '5XXErrorRate',
  '401ErrorRate',
  '403ErrorRate',
  '404ErrorRate',
  '502ErrorRate',
  '503ErrorRate',
  '504ErrorRate',
  'BytesDownloaded',
  'BytesUploaded',
  'CacheHitRate',
  'OriginLatency',
  'Requests',
  'TotalErrorRate',
];

export interface NestedCloudFrontAlarmStackProps extends BaseNestedStackProps {
  metricAlarms: ConfigMetricAlarmName[];
}

export class NestedCloudFrontAlarmsStack extends BaseNestedStack {
  constructor(scope: cdk.Construct, id: string, props: NestedCloudFrontAlarmStackProps) {
    super(scope, id, props);

    props.metricAlarms.forEach(metricAlarm => {
      const dimensions = {
        DistributionId: metricAlarm.resourceName,
      };

      this.setupAlarm(metricAlarm, MetricNamespace.CloudFront, dimensions);
    });
  }
}

export async function createCloudFrontMonitoring(
  stack: cdk.Stack,
  props?: CloudFrontProps,
): Promise<NestedCloudFrontAlarmsStack[]> {
  const distributions = await getDistributions(props?.include, props?.exclude);
  const metricAlarms: ConfigMetricAlarmName[] = [];

  distributions.forEach(distribution => {
    cloudFrontMetrics.forEach(metric => {
      const defaultConf = props?.default?.[metric];
      const localConf = props?.local?.[distribution.Id]?.[metric];
      if (isEnabled(defaultConf, localConf)) {
        metricAlarms.push(generateMetricAlarm(metric, distribution.Id, defaultConf, localConf));
      }
    });
  });

  if (metricAlarms.length === 0) {
    return [];
  }

  // Split more than 50 cloudfronts to multiple stacks
  if (metricAlarms.length > 50) {
    return chunk(metricAlarms, 50).map((metricAlarms, index) => {
      return new NestedCloudFrontAlarmsStack(stack, stack.stackName + '-cloudfront-alarms-' + (index + 1), {
        snsStack: props?.snsStack,
        metricAlarms,
      });
    });
  }

  // Create single stack
  return [
    new NestedCloudFrontAlarmsStack(stack, stack.stackName + '-cloudfront-alarms', {
      snsStack: props?.snsStack,
      metricAlarms,
    }),
  ];
}
