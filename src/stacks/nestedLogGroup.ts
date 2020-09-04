import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cw from '@aws-cdk/aws-cloudwatch';
import * as logs from '@aws-cdk/aws-logs';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';
import { chunk } from '../utils/utils';
import { getMetricFilterConfig } from '../utils/logGroup';
import { getMetricConfig } from '../utils/metric';
import { getAlarmConfig } from '../utils/alarm';

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
    logGroups: config.ConfigLocals,
    props?: NestedLogGroupAlarmsStackProps,
  ) {
    super(scope, id, snsStack, defaultType, props);

    Object.keys(logGroups).forEach(groupName => {
      const groupConfig = logGroups[groupName];
      const metricFilterNames = Array.from(
        new Set([
          ...Object.keys(config.configGetAllDefaults(this.defaultType) as config.ConfigLogGroupAlarms),
          ...Object.keys(groupConfig),
        ]),
      );

      metricFilterNames.forEach(metricFilterName => {
        const { pattern }: config.MetricFilterOptions = getMetricFilterConfig(
          this.defaultType,
          metricFilterName,
          groupConfig,
        );

        if (props?.metricFilter === undefined || props?.metricFilter === true) {
          this.setupMetricFilter(groupName, metricFilterName, pattern as string, groupConfig);
        }

        const metricName = `${groupName}-${metricFilterName}`;

        this.setupMetricFilterAlarm(`${groupName}-alarm`, metricFilterName, metricName, groupConfig);
      });
    });
  }

  private setupMetricFilter(
    groupName: string,
    metricFilterName: string,
    pattern: string,
    localConf: config.ConfigMetricAlarms,
  ): void {
    const isEnabled = config.configIsEnabled(this.defaultType, metricFilterName, localConf);
    const suffix = config.configAlarmSuffix(this.defaultType, metricFilterName, localConf);
    const fullMetricFilteName = suffix ? `${metricFilterName}-${suffix}` : metricFilterName;

    if (!isEnabled) {
      return;
    }

    const name = `${groupName}-${fullMetricFilteName}`;
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
    localName: string,
    metricConfigName: string,
    metricName: string,
    localConf: config.ConfigMetricAlarms,
  ): void {
    const autoResolve = config.configAutoResolve(this.defaultType, metricConfigName, localConf);
    const isEnabled = config.configIsEnabled(this.defaultType, metricConfigName, localConf);
    const suffix = config.configAlarmSuffix(this.defaultType, metricConfigName, localConf);
    const fullMetricName = suffix ? `${metricName}-${suffix}` : metricName;

    if (!isEnabled) {
      return;
    }

    const metric = new cw.Metric({
      ...getMetricConfig(this.defaultType, metricConfigName, localConf),
      metricName: fullMetricName,
      // unit is not defined with custom metrics,
      // so it can break the connection between the alarm and metric
      unit: undefined,
    });

    const alarm = metric.createAlarm(this, `${localName}-${fullMetricName}`, {
      ...getAlarmConfig(this.defaultType, metricConfigName, localConf),
      alarmName: fullMetricName,
    });

    this.snsStack.addAlarmActions(alarm, autoResolve);
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
