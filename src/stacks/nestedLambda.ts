import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cw from '@aws-cdk/aws-cloudwatch';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';
import { chunk } from '../utils/utils';

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

function getAliases(metricName: string): string[] {
  switch (metricName) {
    case 'Invocations': return ['invocations']
    case 'Errors': return ['errors']
    case 'Duration': return ['duration']
    case 'Throtles': return ['throttles']
    default: return []
  }
}

// Generate nested stack for lambda alarms
export class NestedLambdaAlarmsStack extends BaseNestedStack {
  constructor(
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    lambdas: config.ConfigLocals,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    // Setup tables
    Object.keys(lambdas).forEach(lambdaName => {
      const lambdaConfig = lambdas[lambdaName];
      const dimensions = {
        FunctionName: lambdaName,
      };

      lambdaMetrics.forEach(metricName => {
        switch (metricName) {
          case 'Errors':
            this.setupAlarm(lambdaName, metricName, lambdaConfig, dimensions);
        }

      });
    });
  }
}

// Setup lambda alarms
export function createLambdaMonitoring(stack: cdk.Stack, snsStack: NestedSNSStack): NestedLambdaAlarmsStack[] {
  const lambdas = config.configGetAllEnabled(localType, lambdaMetrics, getAliases);
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
