import * as cdk from '@aws-cdk/core';

import BaseNestedStack, { BaseNestedStackProps } from './baseNestedStack';
import { ConfigMetricAlarm, ConfigMetricAlarmName, MonitoringConfigNoLocal } from '../utils/types';
import { isEnabled, generateMetricAlarm, MetricNamespace } from '../utils';

export interface AccountConfigProps {
  AccountMaxReads: ConfigMetricAlarm;
  AccountMaxTableLevelReads: ConfigMetricAlarm;
  AccountMaxTableLevelWrites: ConfigMetricAlarm;
  AccountMaxWrites: ConfigMetricAlarm;
  AccountProvisionedReadCapacityUtilization: ConfigMetricAlarm;
  AccountProvisionedWriteCapacityUtilization: ConfigMetricAlarm;
  UserErrors: ConfigMetricAlarm;
}

export type AccountProps = MonitoringConfigNoLocal<AccountConfigProps>;

export type AccountPropsKeys = (keyof AccountConfigProps)[];

export const accountPropsKeys: AccountPropsKeys = [
  'AccountMaxReads',
  'AccountMaxTableLevelReads',
  'AccountMaxTableLevelWrites',
  'AccountMaxWrites',
  'AccountProvisionedReadCapacityUtilization',
  'AccountProvisionedWriteCapacityUtilization',
  'UserErrors',
];

export interface NestedAccountAlarmStackProps extends BaseNestedStackProps {
  metricAlarms: ConfigMetricAlarmName[];
}

export class NestedAccountAlarmsStack extends BaseNestedStack {
  constructor(scope: cdk.Construct, id: string, props: NestedAccountAlarmStackProps) {
    super(scope, id, props);

    props.metricAlarms.forEach(metricAlarm => {
      this.setupAlarm(metricAlarm, MetricNamespace.DynamoDB);
    });
  }
}

export async function createAccountMonitoring(
  stack: cdk.Stack,
  props?: AccountProps,
): Promise<NestedAccountAlarmsStack[]> {
  const metricAlarms: ConfigMetricAlarmName[] = [];

  accountPropsKeys.forEach(metric => {
    const defaultConf = props?.default?.[metric];
    if (isEnabled(defaultConf)) {
      metricAlarms.push(generateMetricAlarm(metric, '', defaultConf));
    }
  });

  if (metricAlarms.length === 0) {
    return [];
  }

  // Create single stack
  return [
    new NestedAccountAlarmsStack(stack, stack.stackName + '-account-alarms', {
      snsStack: props?.snsStack,
      metricAlarms,
    }),
  ];
}
