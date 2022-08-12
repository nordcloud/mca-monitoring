import { NestedStackProps, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

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
    scope: Construct,
    id: string,
    snsStack: NestedSNSStack,
    appSyncApis: config.ConfigLocals<config.ConfigMetricAlarms>,
    props?: NestedStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    Object.keys(appSyncApis).forEach(appSyncApiId => {
      const appSyncApiConfig = appSyncApis[appSyncApiId];
      const dimensions = {
        GraphQLAPIId: appSyncApiId
      };

      appSyncApiMetrics.forEach(metricName => {
        if (appSyncApiConfig[metricName]) {
          this.setupAlarm(appSyncApiId, metricName, appSyncApiConfig[metricName], dimensions);
        }
      })
    });
  }
}

export function createAppSyncMonitoring(stack: Stack, snsStack: NestedSNSStack, versionReportingEnabled = true): NestedAppSyncAlarmsStack[] {
  return config.chunkByStackLimit(localType, appSyncApiMetrics, 0, versionReportingEnabled).map((stackAppSyncs, index) => {
    return new NestedAppSyncAlarmsStack(
      stack,
      stack.stackName + '-appsync-alarms-' + (index + 1),
      snsStack,
      stackAppSyncs
    );
  });
}
