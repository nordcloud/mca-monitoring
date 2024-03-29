import { NestedStackProps, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';

export const cloudFrontMetrics = [
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

const defaultType = config.ConfigDefaultType.Cloudfront;
const localType = config.ConfigLocalType.Cloudfront;

export class NestedCloudFrontAlarmsStack extends BaseNestedStack {
  constructor(
    scope: Construct,
    id: string,
    snsStack: NestedSNSStack,
    distributions: config.ConfigLocals<config.ConfigMetricAlarms>,
    props?: NestedStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    Object.keys(distributions).forEach(id => {
      const conf = distributions[id];
      const dimensions = {
        DistributionId: id,
      };

      cloudFrontMetrics.forEach(metricName => {
        if (conf[metricName]) {
          this.setupAlarm(id, metricName, conf[metricName], dimensions);
        }
      });
    });
  }
}

export function createCloudFrontAlarms(stack: Stack, snsStack: NestedSNSStack, versionReportingEnabled = true): NestedCloudFrontAlarmsStack[] {
  return config.chunkByStackLimit(localType, cloudFrontMetrics, 0, versionReportingEnabled).map((stackDistributions, index) => {
    return new NestedCloudFrontAlarmsStack(
      stack,
      stack.stackName + '-cloudfront-alarms-' + (index + 1),
      snsStack,
      stackDistributions,
    );
  });
}
