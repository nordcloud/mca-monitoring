import { NestedStackProps, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';

export const lambdaMetrics = [
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

const defaultType = config.ConfigDefaultType.Lambda;
const localType = config.ConfigLocalType.Lambda;

// Generate nested stack for lambda alarms
export class NestedLambdaAlarmsStack extends BaseNestedStack {
  constructor(
    scope: Construct,
    id: string,
    snsStack: NestedSNSStack,
    lambdas: config.ConfigLocals<config.ConfigMetricAlarms>,
    props?: NestedStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    // Setup lambdas
    Object.keys(lambdas).forEach(lambdaName => {
      const lambdaConfig = lambdas[lambdaName];
      const dimensions = {
        FunctionName: lambdaName,
      };

      lambdaMetrics.forEach(metricName => {
        if (lambdaConfig[metricName]) {
          this.setupAlarm(lambdaName, metricName, lambdaConfig[metricName], dimensions);
        }
      });
    });
  }
}

// Setup lambda alarms
export function createLambdaMonitoring(stack: Stack, snsStack: NestedSNSStack, versionReportingEnabled = true): NestedLambdaAlarmsStack[] {
  return config.chunkByStackLimit(localType, lambdaMetrics, 0, versionReportingEnabled).map((stackLambdas, index) => {
    return new NestedLambdaAlarmsStack(
      stack,
      stack.stackName + '-lambda-alarms-' + (index + 1),
      snsStack,
      stackLambdas,
    );
  });
}
