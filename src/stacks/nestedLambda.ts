import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';
import { getFilledChunks } from '../utils/chunks';
import { getDeployedResourcesToMonitor } from '../utils/cloudfront';

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
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    lambdas: config.ConfigLocals<config.ConfigMetricAlarms>,
    props?: cfn.NestedStackProps,
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
export async function createLambdaMonitoring(
  stack: cdk.Stack,
  snsStack: NestedSNSStack,
): Promise<NestedLambdaAlarmsStack[]> {
  const lambdas = config.configGetAllEnabled(localType, lambdaMetrics);
  const lambdaKeys: string[] = Object.keys(lambdas);

  const alarmsStackName = 'lambdaAlarms';
  const nestedStackNamePrefix = `${stack.stackName}-${alarmsStackName}`;

  const deployedResourcesToMonitor = await getDeployedResourcesToMonitor(lambdaKeys, nestedStackNamePrefix);
  const chunks = getFilledChunks(deployedResourcesToMonitor, lambdaKeys);

  // Nothing to create
  if (lambdaKeys.length === 0) {
    return [];
  }

  return chunks
    .map(
      (chunk: string[], index): NestedLambdaAlarmsStack => {
        const stackLambdas = config.configGetSelected(localType, chunk);

        if (chunk.length === 0) {
          // @ts-ignore
          return null;
        }

        return new NestedLambdaAlarmsStack(stack, `${alarmsStackName}${index + 1}`, snsStack, stackLambdas);
      },
    )
    .filter(Boolean);
}
