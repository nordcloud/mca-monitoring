import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cw from '@aws-cdk/aws-cloudwatch';

import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';
import { getAlarmConfig } from '../utils/alarm';
import { getMetricConfig } from '../utils/metric';

export class NestedAccountAlarmsStack extends cfn.NestedStack {
  private snsStack: NestedSNSStack;

  constructor(scope: cdk.Construct, id: string, snsStack: NestedSNSStack, props?: cfn.NestedStackProps) {
    super(scope, id, props);

    this.snsStack = snsStack;

    //this.setupAccountAlarm('AccountMaxReads');
    //this.setupAccountAlarm('AccountMaxTableLevelReads');
    //this.setupAccountAlarm('AccountMaxTableLevelWrites');
    //this.setupAccountAlarm('AccountMaxWrites');
    //this.setupAccountAlarm('AccountProvisionedReadCapacityUtilization');
    //this.setupAccountAlarm('AccountProvisionedWriteCapacityUtilization');
    this.setupAccountAlarm('UserErrors');
  }

  private setupAccountAlarm(metricName: string): void {
    const autoResolve = config.autoResolve(config.ConfigDefaultType.Account, metricName);

    const metric = new cw.Metric({
      ...getMetricConfig(config.ConfigDefaultType.Account, metricName),
      dimensions: {},
    });

    const alarm = metric.createAlarm(this, metricName, {
      ...getAlarmConfig(config.ConfigDefaultType.Account, metricName),
      alarmName: metricName,
      actionsEnabled: config.isEnabled(config.ConfigDefaultType.Account, metricName),
    });

    this.snsStack.addAlarmActions(alarm, autoResolve);
  }
}

export function createAccountAlarms(stack: cdk.Stack, snsStack: NestedSNSStack): NestedAccountAlarmsStack[] {
  return [new NestedAccountAlarmsStack(stack, stack.stackName + '-account-alarms', snsStack)];
}
