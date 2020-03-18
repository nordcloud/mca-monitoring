import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cw from '@aws-cdk/aws-cloudwatch';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';
import { getAlarmConfig } from '../utils/alarm';
import { chunk } from '../utils/utils';

export const lambdaMetrics = ['errors', 'invaocations', 'duration', 'throttles'];

const defaultType = config.ConfigDefaultType.Lambda;
const localType = config.ConfigLocalType.Lambda;

// Generate nested stack for lambda alarms
export class NestedLambdaAlarmsStack extends BaseNestedStack {
  constructor(
    scope: cdk.Stack,
    id: string,
    snsStack: NestedSNSStack,
    lambdas: config.ConfigLocals,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    // Setup lambdas
    Object.keys(lambdas).forEach(name => {
      const lambdaConfig = lambdas[name];

      if (lambdaConfig) {
        // Load lambda from existing arn
        const fn = lambda.Function.fromFunctionArn(this, name, lambdaConfig?.arn || '');

        // Setup lambda alarms
        this.setupLambdaAlarm(name, 'errors', fn.metricErrors(), lambdaConfig);
        this.setupLambdaAlarm(name, 'invocations', fn.metricInvocations(), lambdaConfig);
        this.setupLambdaAlarm(name, 'duration', fn.metricDuration(), lambdaConfig);
        this.setupLambdaAlarm(name, 'throttles', fn.metricThrottles(), lambdaConfig);
      }
    });
  }

  private setupLambdaAlarm(lambdaName: string, metricName: string, metric: cw.Metric, conf?: config.ConfigLocal): void {
    const autoResolve = config.configAutoResolve(this.defaultType, metricName, conf?.config);
    const isEnabled = config.configIsEnabled(this.defaultType, metricName, conf?.config);

    if (!isEnabled) {
      return;
    }

    const alarmName = `${lambdaName}-${metricName}`;
    const alarm = metric.createAlarm(this, alarmName, {
      ...getAlarmConfig(this.defaultType, metricName, conf?.config?.alarm),
      alarmName,
    });

    this.snsStack.addAlarmActions(alarm, autoResolve);
  }
}

// Setup lambda alarms
export function createLambdaMonitoring(stack: cdk.Stack, snsStack: NestedSNSStack): NestedLambdaAlarmsStack[] {
  const lambdas = config.configGetAllEnabled(localType, lambdaMetrics);
  const lambdaKeys: string[] = Object.keys(lambdas);

  // Nothing to create
  if (lambdaKeys.length === 0) {
    return [];
  }

  // Split more than 30 lambdas to multiple stacks
  if (lambdaKeys.length > 30) {
    return chunk(lambdaKeys, 30).map((lambdaKeys, index) => {
      const stackLambdas = config.configGetSelected(localType, lambdaKeys);
      return new NestedLambdaAlarmsStack(
        stack,
        stack.stackName + '-lambda-alarms-' + (index + 1),
        snsStack,
        stackLambdas,
      );
    });
  }

  // Create single stack
  return [new NestedLambdaAlarmsStack(stack, stack.stackName + '-lambda-alarms', snsStack, lambdas)];
}
