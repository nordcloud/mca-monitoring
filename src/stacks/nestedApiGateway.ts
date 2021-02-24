import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';

export const apiGatewayMetrics = [
  '4XXError',
  '5XXError',
  'CacheHitCount',
  'CacheMissCount',
  'Count',
  'IntegrationLatency',
  'Latency',
];

const defaultType = config.ConfigDefaultType.ApiGateway;
const localType = config.ConfigLocalType.ApiGateway;

export class NestedApiGatewayAlarmsStack extends BaseNestedStack {
  constructor(
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    routes: config.ConfigLocals<config.ConfigMetricAlarms>,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    Object.keys(routes).forEach(name => {
      const routeConf = routes[name];
      const dimensions = {
        ApiName: name,
      };

      apiGatewayMetrics.forEach(metricName => {
        if (routeConf[metricName]) {
          this.setupAlarm(name, metricName, routeConf[metricName], dimensions);
        }
      });
    });
  }
}

export function createApiGatewayAlarms(stack: cdk.Stack, snsStack: NestedSNSStack): NestedApiGatewayAlarmsStack[] {
  return config.chunkByStackLimit(localType, apiGatewayMetrics).map((stackGateways, index) => {
    return new NestedApiGatewayAlarmsStack(
      stack,
      stack.stackName + '-api-gateway-alarms-' + (index + 1),
      snsStack,
      stackGateways,
    );
  });
}
