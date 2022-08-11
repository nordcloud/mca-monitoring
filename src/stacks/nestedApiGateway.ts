import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

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
    scope: Construct,
    id: string,
    snsStack: NestedSNSStack,
    routes: config.ConfigLocals<config.ConfigMetricAlarms>,
    props?: cdk.NestedStackProps,
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

export function createApiGatewayAlarms(stack: cdk.Stack, snsStack: NestedSNSStack, versionReportingEnabled = true): NestedApiGatewayAlarmsStack[] {
  return config.chunkByStackLimit(localType, apiGatewayMetrics, 0, versionReportingEnabled).map((stackGateways, index) => {
    return new NestedApiGatewayAlarmsStack(
      stack,
      stack.stackName + '-api-gateway-alarms-' + (index + 1),
      snsStack,
      stackGateways,
    );
  });
}
