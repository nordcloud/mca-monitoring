import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';
import { chunk } from '../utils/utils';

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
    routes: config.ConfigLocals,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    Object.keys(routes).forEach(name => {
      const routeConf = routes[name];
      const dimensions = {
        ApiName: name,
      };

      apiGatewayMetrics.forEach(metricName => {
        this.setupAlarm(name, metricName, routeConf, dimensions);
      });
    });
  }
}

export function createApiGatewayAlarms(stack: cdk.Stack, snsStack: NestedSNSStack): NestedApiGatewayAlarmsStack[] {
  const clusters = config.configGetAllEnabled(localType, apiGatewayMetrics);
  const keys = Object.keys(clusters);

  if (keys.length === 0) {
    return [];
  }

  if (keys.length > 30) {
    return chunk(keys, 30).map((keys, index) => {
      const clusters = config.configGetSelected(localType, keys);
      return new NestedApiGatewayAlarmsStack(
        stack,
        stack.stackName + '-api-gateway-alarms-' + (index + 1),
        snsStack,
        clusters,
      );
    });
  }

  return [new NestedApiGatewayAlarmsStack(stack, stack.stackName + '-api-gateway-alarms', snsStack, clusters)];
}
