import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';

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
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    distributions: config.ConfigLocals<config.ConfigMetricAlarms>,
    props?: cfn.NestedStackProps,
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

export function createCloudFrontAlarms(stack: cdk.Stack, snsStack: NestedSNSStack): NestedCloudFrontAlarmsStack[] {
  return config.chunkByStackLimit(localType, cloudFrontMetrics).map((stackDistributions, index) => {
    return new NestedCloudFrontAlarmsStack(
      stack,
      stack.stackName + '-cloudfront-alarms-' + (index + 1),
      snsStack,
      stackDistributions,
    );
  });
}
