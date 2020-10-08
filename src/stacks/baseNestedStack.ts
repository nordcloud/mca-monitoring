import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cw from '@aws-cdk/aws-cloudwatch';

import * as config from '../utils/config';
import { NestedSNSStack } from './nestedSns';
import { getTreatMissingData, getComparisonOperator } from '../utils/alarm';
import { getUnit, getDuration, defaultConfigToNameSpace } from '../utils/metric';

export interface SetupAlarmOpts {
  aliases?: string[];
}

export default class BaseNestedStack extends cfn.NestedStack {
  protected readonly snsStack: NestedSNSStack;
  protected readonly defaultType: config.ConfigDefaultType;
  protected readonly localType?: config.ConfigLocalType;

  constructor(
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    defaultType: config.ConfigDefaultType,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, props);

    this.defaultType = defaultType;
    this.localType = config.configDefaultTypeToLocal(defaultType);
    this.snsStack = snsStack;
  }

  protected setupAlarm(
    localName: string,
    metricName: string,
    localConf: config.ConfigMetricAlarm,
    dimensions?: object,
  ): void {
    const isEnabled = localConf.enabled !== false;
    const localEnabled = Object.values(localConf.alarm || {}).find(l => l.enabled === true);
    if (!isEnabled && !localEnabled) {
      return;
    }

    if (!localConf.metric) {
      console.error(`Missing metric for ${localName}-${metricName}`);
      return;
    }

    if (!localConf.alarm) {
      console.error(`Missing alarms for ${localName}-${metricName}`);
      return;
    }

    const metric = new cw.Metric({
      ...localConf.metric,
      unit: getUnit(localConf.metric?.unit),
      period: getDuration(localConf.metric?.period),
      metricName,
      dimensions,
      namespace: defaultConfigToNameSpace(this.defaultType),
    });

    Object.keys(localConf?.alarm || {}).forEach(topic => {
      const conf = localConf?.alarm?.[topic];
      if (conf && conf.enabled !== false) {
        const alarmName = `${localName}-${metricName}-${topic}`;
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
