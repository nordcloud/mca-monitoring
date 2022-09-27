import { NestedStackProps, Stack, aws_cloudwatch as cw, aws_logs as logs }from 'aws-cdk-lib';
import { Construct } from 'constructs';

import BaseNestedStack from './baseNestedStack';
import { NestedSNSStack } from './nestedSns';
import * as config from '../utils/config';
import { getTreatMissingData, getComparisonOperator } from '../utils/alarm';
import { getDuration, defaultConfigToNameSpace } from '../utils/metric';

const defaultType = config.ConfigDefaultType.LogGroup;
const localType = config.ConfigLocalType.LogGroup;

export interface LogGroupsProps {
  metricFilter?: boolean;
}

export interface NestedLogGroupAlarmsStackProps extends NestedStackProps {
  metricFilter?: boolean;
}

export class NestedLogGroupAlarmsStack extends BaseNestedStack {
  constructor(
    scope: Construct,
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
    if (!config.configIsEnabled(localConf)) {
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
    if (!config.configIsEnabled(localConf)) {
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

    const metricName = `${groupName}-${metricFilterName}`;
    const metric = new cw.Metric({
      ...localConf.metric,
      period: getDuration(localConf.metric?.period),
      namespace: defaultConfigToNameSpace(this.defaultType),
      metricName,
      // unit is not defined with custom metrics,
      // so it can break the connection between the alarm and metric
      unit: undefined,
    });

    let prevAlarm: cw.Alarm | undefined;

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

        if (prevAlarm) {
          alarm.node.addDependency(prevAlarm)
        }

        prevAlarm = alarm;

        this.snsStack.addAlarmActions(topic, alarm, localConf.autoResolve === true || conf.autoResolve === true);
      }
    });
  }
}

// Setup alarms based on metric filters
export function createLogGroupMonitoring(
  stack: Stack,
  snsStack: NestedSNSStack,
  props?: LogGroupsProps,
  versionReportingEnabled = true
): NestedLogGroupAlarmsStack[] {
  return config.chunkByStackLimit(localType, undefined, 1, versionReportingEnabled).map((stackLogGroups, index) => {
    return new NestedLogGroupAlarmsStack(
      stack,
      stack.stackName + '-log-group-alarms-' + (index + 1),
      snsStack,
      stackLogGroups,
      props,
    );
  });
}
