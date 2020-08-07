import * as cdk from '@aws-cdk/core';

import BaseNestedStack, { BaseNestedStackProps } from './baseNestedStack';
import { isEnabled, generateMetricAlarm, chunk, MetricNamespace } from '../utils';
import { MonitoringConfig, ConfigMetricAlarm, ConfigMetricAlarmName } from '../utils/types';
import { getRoutes } from '../aws-sdk';

export interface ApiGatewayConfigProps {
  '4XXError': ConfigMetricAlarm;
  '5XXError': ConfigMetricAlarm;
  CacheHitCount: ConfigMetricAlarm;
  CacheMissCount: ConfigMetricAlarm;
  Count: ConfigMetricAlarm;
  IntegrationLatency: ConfigMetricAlarm;
  Latency: ConfigMetricAlarm;
}

export type ApiGatewayProps = MonitoringConfig<ApiGatewayConfigProps>;

export type ApiGatewayPropsKeys = (keyof ApiGatewayConfigProps)[];

export const apiGatewayMetrics: ApiGatewayPropsKeys = [
  '4XXError',
  '5XXError',
  'CacheHitCount',
  'CacheMissCount',
  'Count',
  'IntegrationLatency',
  'Latency',
];

export interface NestedApiGatewayAlarmStackProps extends BaseNestedStackProps {
  metricAlarms: ConfigMetricAlarmName[];
}

export class NestedApiGatewayAlarmsStack extends BaseNestedStack {
  constructor(scope: cdk.Construct, id: string, props: NestedApiGatewayAlarmStackProps) {
    super(scope, id, props);

    props.metricAlarms.forEach(metricAlarm => {
      const dimensions = {
        ApiName: metricAlarm.resourceName,
      };

      this.setupAlarm(metricAlarm, MetricNamespace.ApiGateway, dimensions);
    });
  }
}

export async function createApiGatewayMonitoring(
  stack: cdk.Stack,
  props?: ApiGatewayProps,
): Promise<NestedApiGatewayAlarmsStack[]> {
  const routes = await getRoutes(props?.include, props?.exclude);
  const metricAlarms: ConfigMetricAlarmName[] = [];

  routes.forEach(route => {
    apiGatewayMetrics.forEach(metric => {
      const defaultConf = props?.default?.[metric];
      const localConf = props?.local?.[route.name || '']?.[metric];
      if (isEnabled(defaultConf, localConf)) {
        metricAlarms.push(generateMetricAlarm(metric, route.name, defaultConf, localConf));
      }
    });
  });

  if (metricAlarms.length === 0) {
    return [];
  }

  // Split more than 50 routes to multiple stacks
  if (metricAlarms.length > 50) {
    return chunk(metricAlarms, 50).map((metricAlarms, index) => {
      return new NestedApiGatewayAlarmsStack(stack, stack.stackName + '-api-gateway-alarms-' + (index + 1), {
        snsStack: props?.snsStack,
        metricAlarms,
      });
    });
  }

  // Create single stack
  return [
    new NestedApiGatewayAlarmsStack(stack, stack.stackName + '-api-gateway-alarms', {
      snsStack: props?.snsStack,
      metricAlarms,
    }),
  ];
}
