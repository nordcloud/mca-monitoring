import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cw from '@aws-cdk/aws-cloudwatch';

import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';
import { getTreatMissingData, getComparisonOperator } from '../utils/alarm';
import { getUnit, getDuration, defaultConfigToNameSpace } from '../utils/metric';

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
    const conf = config.configGetAllDefaults(config.ConfigDefaultType.Account)?.[metricName];
    if (!conf) {
      return;
    }

    const isEnabled = conf.enabled;
    const localEnabled = Object.values(conf.alarm || {}).find(l => l.enabled === true);
    if (!isEnabled && !localEnabled) {
      return;
    }

    if (!conf.metric) {
      console.error(`Missing metric for Account-${metricName}`);
      return;
    }

    if (!conf.alarm) {
      console.error(`Missing alarms for Account-${metricName}`);
      return;
    }

    const metric = new cw.Metric({
      ...conf.metric,
      unit: getUnit(conf.metric?.unit),
      period: getDuration(conf.metric?.period),
      metricName,
      namespace: defaultConfigToNameSpace(config.ConfigDefaultType.Account),
      dimensions: {},
    });

    Object.keys(conf?.alarm || {}).forEach(topic => {
      const confAlarm = conf?.alarm?.[topic];
      if (confAlarm && confAlarm.enabled !== false) {
        const alarmName = `${metricName}-${topic}`;
        const alarm = metric.createAlarm(this, alarmName, {
          ...confAlarm,
          treatMissingData: getTreatMissingData(confAlarm?.treatMissingData),
          comparisonOperator: getComparisonOperator(confAlarm?.comparisonOperator),
          alarmName,
          actionsEnabled: true,
        });

        this.snsStack.addAlarmActions(topic, alarm, conf.autoResolve === true || confAlarm?.autoResolve === true);
      }
    });
  }
}

export function createAccountAlarms(stack: cdk.Stack, snsStack: NestedSNSStack): NestedAccountAlarmsStack[] {
  return [new NestedAccountAlarmsStack(stack, stack.stackName + '-account-alarms', snsStack)];
}
