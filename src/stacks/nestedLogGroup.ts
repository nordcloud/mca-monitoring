import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cw from '@aws-cdk/aws-cloudwatch';
import * as logs from '@aws-cdk/aws-logs';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';
import { chunk } from '../utils/utils';
import { getTreatMissingData, getComparisonOperator } from '../utils/alarm';
import { getDuration, defaultConfigToNameSpace } from '../utils/metric';

const defaultType = config.ConfigDefaultType.LogGroup;
const localType = config.ConfigLocalType.LogGroup;

export interface LogGroupsProps {
  metricFilter?: boolean;
}

export interface NestedLogGroupAlarmsStackProps extends cfn.NestedStackProps {
  metricFilter?: boolean;
}

export class NestedLogGroupAlarmsStack extends BaseNestedStack {
  constructor(
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    logGroups: config.ConfigLocals<config.ConfigLogGroupAlarms>,
    props?: NestedLogGroupAlarmsStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    Object.keys(logGroups).forEach(groupName => {
      const groupConfig = logGroups[groupName];

      Object.keys(groupConfig).forEach(metricFilterName => {
        const local = groupConfig[metricFilterName];
        if (local && local?.filter?.pattern) {
          this.setupMetricFilter(groupName, metricFilterName, local?.filter?.pattern, local);
          this.setupMetricFilterAlarm(groupName, metricFilterName, local);
        }
      });
    });
  }

  private setupMetricFilter(
    groupName: string,
    metricFilterName: string,
    pattern: string,
    localConf: config.ConfigMetricAlarm,
  ): void {
    const isEnabled = localConf.enabled !== false;
    const localEnabled = Object.values(localConf.alarm || {}).find(l => l.enabled === true);
    if (!isEnabled && !localEnabled) {
      return;
    }

    const name = `${groupName}-${metricFilterName}`;
    new logs.MetricFilter(this, name, {
      filterPattern: logs.FilterPattern.literal(pattern),
      logGroup: logs.LogGroup.fromLogGroupName(this, `${name}-log-group`, groupName),
      metricName: name,
      metricNamespace: 'Custom',
      defaultValue: 0,
      metricValue: '1',
    });
  }

  protected setupMetricFilterAlarm(
    groupName: string,
    metricFilterName: string,
    localConf: config.ConfigMetricAlarm,
  ): void {
    const isEnabled = localConf.enabled !== false;
    const localEnabled = Object.values(localConf.alarm || {}).find(l => l.enabled !== false);
    if (!isEnabled && !localEnabled) {
      return;
    }

    if (!localConf.metric) {
      console.error(`Missing metric for ${groupName}-${metricFilterName}`);
      return;
    }

    if (!localConf.alarm) {
      console.error(`Missing alarms for ${groupName}-${metricFilterName}`);
      return;
    }

    const metric = new cw.Metric({
      period: getDuration(localConf.metric?.period),
      namespace: defaultConfigToNameSpace(this.defaultType),
      metricName: metricFilterName,
      // unit is not defined with custom metrics,
      // so it can break the connection between the alarm and metric
      unit: undefined,
    });

    Object.keys(localConf?.alarm || {}).forEach(topic => {
      const conf = localConf?.alarm?.[topic];
      if (conf && conf.enabled !== false) {
        const alarmName = `${groupName}-${metricFilterName}-${topic}`;
        const alarm = metric.createAlarm(this, alarmName, {
          ...conf,
          treatMissingData: getTreatMissingData(conf?.treatMissingData),
          comparisonOperator: getComparisonOperator(conf?.comparisonOperator),
          alarmName,
          actionsEnabled: true,
        });

        this.snsStack.addAlarmActions(topic, alarm, localConf.autoResolve === true || conf.autoResolve === true);
      }
    });
  }
}

// Setup alarms based on metric filters
export function createLogGroupMonitoring(
  stack: cdk.Stack,
  snsStack: NestedSNSStack,
  props?: LogGroupsProps,
): NestedLogGroupAlarmsStack[] {
  const logGroups = config.configGetAll(localType);
  const logGroupKeys: string[] = Object.keys(logGroups);

  // Nothing to create
  if (logGroupKeys.length === 0) {
    return [];
  }

  // // Split over 30 log groups' resources to multiple stacks
  if (logGroupKeys.length > 30) {
    return chunk(logGroupKeys, 30).map((keys, index) => {
      const stackLogGroups = config.configGetSelected(localType, keys);
      return new NestedLogGroupAlarmsStack(
        stack,
        stack.stackName + '-log-group-alarms-' + (index + 1),
        snsStack,
        stackLogGroups,
        { metricFilter: props?.metricFilter },
      );
    });
  }

  // Create single stack
  return [
    new NestedLogGroupAlarmsStack(stack, stack.stackName + '-log-group-alarms', snsStack, logGroups, {
      metricFilter: props?.metricFilter,
    }),
  ];
}
