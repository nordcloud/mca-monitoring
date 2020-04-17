import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cw from '@aws-cdk/aws-cloudwatch';

import * as config from '../utils/config';
import { NestedSNSStack } from './nestedSns';
import { getAlarmConfig } from '../utils/alarm';
import { getMetricConfig } from '../utils/metric';

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
    localConf: config.ConfigMetricAlarms,
    dimensions?: object,
  ): void {
    const autoResolve = config.configAutoResolve(this.defaultType, metricName, localConf);
    const isEnabled = config.configIsEnabled(this.defaultType, metricName, localConf);

    if (!isEnabled) {
      return;
    }

    const metric = new cw.Metric({
      ...getMetricConfig(this.defaultType, metricName, localConf),
      dimensions,
    });

    const alarmName = `${localName}-${metricName}`;
    const alarm = metric.createAlarm(this, alarmName, {
      ...getAlarmConfig(this.defaultType, metricName, localConf),
      alarmName,
    });

    this.snsStack.addAlarmActions(alarm, autoResolve);
  }
}
