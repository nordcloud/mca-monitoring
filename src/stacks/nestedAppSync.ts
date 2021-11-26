import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';

export const appSyncApiMetrics = [
  '4XXError',
  '5XXError',
  'Latency',
  'ConnectSuccess',
  'ConnectClientError',
  'ConnectServerError',
  'DisconnectSuccess',
  'DisconnectClientError',
  'DisconnectServerError',
  'SubscribeSuccess',
  'SubscribeClientError',
  'SubscribeServerError',
  'UnsubscribeSuccess',
  'UnsubscribeClientError',
  'UnsubscribeServerError',
  'PublishDataMessageSuccess',
  'PublishDataMessageClientError',
  'PublishDataMessageServerError',
  'PublishDataMessageSize',
  'ActiveConnection',
  'ActiveSubscription',
  'ConnectionDuration',
];

const defaultType = config.ConfigDefaultType.AppSync;
const localType = config.ConfigLocalType.AppSync;

export class NestedAppSyncAlarmsStack extends BaseNestedStack {
  constructor(
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    appSyncApis: config.ConfigLocals<config.ConfigMetricAlarms>,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    Object.keys(appSyncApis).forEach(appSyncApiId => {
      const appSyncApiConfig = appSyncApis[appSyncApiId];

      appSyncApiMetrics.forEach(metricName => {
        if (appSyncApiConfig[metricName]) {
          this.setupAlarm(appSyncApiId, metricName, appSyncApiConfig[metricName]);
        }
      })
    });
  }
}

export function createAppSyncMonitoring(stack: cdk.Stack, snsStack: NestedSNSStack, versionReportingEnabled = true): NestedAppSyncAlarmsStack[] {
  return config.chunkByStackLimit(localType, appSyncApiMetrics, 0, versionReportingEnabled).map((stackAppSyncs, index) => {
    return new NestedAppSyncAlarmsStack(
      stack,
      stack.stackName + '-appsync-alarms-' + (index + 1),
      snsStack,
      stackAppSyncs
    );
  });
}