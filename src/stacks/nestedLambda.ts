import * as cdk from '@aws-cdk/core';

import BaseNestedStack, { BaseNestedStackProps } from './baseNestedStack';
import { isEnabled, generateMetricAlarm, chunk, MetricNamespace } from '../utils';
import { MonitoringConfig, ConfigMetricAlarm, ConfigMetricAlarmName } from '../utils/types';
import { getLambdas } from '../aws-sdk';

export interface LambdaConfigProps {
  Invocations?: ConfigMetricAlarm;
  Errors?: ConfigMetricAlarm;
  DeadLetterErrors?: ConfigMetricAlarm;
  DestinationDeliveryFailures?: ConfigMetricAlarm;
  Throttles?: ConfigMetricAlarm;
  ProvisionedConcurrencyInvocations?: ConfigMetricAlarm;
  ProvisionedConcurrencySpilloverInvocations?: ConfigMetricAlarm;
  Duration?: ConfigMetricAlarm;
  IteratorAge?: ConfigMetricAlarm;
  ConcurrencyExecutions?: ConfigMetricAlarm;
  ProvisionedConcurrencyExecutions?: ConfigMetricAlarm;
  ProvisionedConcurrencyUtilizations?: ConfigMetricAlarm;
  UnreservedConcurrentExecutions?: ConfigMetricAlarm;
}

export type LambdaProps = MonitoringConfig<LambdaConfigProps>;

export type LambdaPropsKeys = (keyof LambdaConfigProps)[];

export const lambdaMetrics: LambdaPropsKeys = [
  'Invocations',
  'Errors',
  'DeadLetterErrors',
  'DestinationDeliveryFailures',
  'Throttles',
  'ProvisionedConcurrencyInvocations',
  'ProvisionedConcurrencySpilloverInvocations',
  'Duration',
  'IteratorAge',
  'ConcurrencyExecutions',
  'ProvisionedConcurrencyExecutions',
  'ProvisionedConcurrencyUtilizations',
  'UnreservedConcurrentExecutions',
];

export interface NestedLambdaAlarmStackProps extends BaseNestedStackProps {
  metricAlarms: ConfigMetricAlarmName[];
}

// Generate nested stack for lambda alarms
export class NestedLambdaAlarmsStack extends BaseNestedStack {
  constructor(scope: cdk.Construct, id: string, props: NestedLambdaAlarmStackProps) {
    super(scope, id, props);

    props.metricAlarms.forEach(metricAlarm => {
      const dimensions = {
        FunctionName: metricAlarm.resourceName,
      };

      this.setupAlarm(metricAlarm, MetricNamespace.Lambda, dimensions);
    });
  }
}

// Setup lambda alarms
export async function createLambdaMonitoring(
  stack: cdk.Stack,
  props?: LambdaProps,
): Promise<NestedLambdaAlarmsStack[]> {
  const lambdas = await getLambdas(props?.include, props?.exclude);
  const metricAlarms: ConfigMetricAlarmName[] = [];

  lambdas.forEach(lambda => {
    lambdaMetrics.forEach(metric => {
      const defaultConf = props?.default?.[metric];
      const localConf = props?.local?.[lambda.FunctionName || '']?.[metric];
      if (isEnabled(defaultConf, localConf)) {
        metricAlarms.push(generateMetricAlarm(metric, lambda.FunctionName, defaultConf, localConf));
      }
    });
  });

  if (metricAlarms.length === 0) {
    return [];
  }

  // Split more than 50 lambdas to multiple stacks
  if (metricAlarms.length > 50) {
    return chunk(metricAlarms, 50).map((metricAlarms, index) => {
      return new NestedLambdaAlarmsStack(stack, stack.stackName + '-lambda-alarms-' + (index + 1), {
        snsStack: props?.snsStack,
        metricAlarms,
      });
    });
  }

  // Create single stack
  return [
    new NestedLambdaAlarmsStack(stack, stack.stackName + '-lambda-alarms', { snsStack: props?.snsStack, metricAlarms }),
  ];
}
