import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cw from '@aws-cdk/aws-cloudwatch';

import * as config from '../utils/config';
import { NestedSNSStack } from './nestedSns';
import { getAlarmConfig } from '../utils/alarm';
import { getMetricConfig } from '../utils/metric';

export default class BaseNestedStack extends cfn.NestedStack {
  protected readonly snsStack: NestedSNSStack;
  protected readonly defaultType: config.ConfigDefaultType;

  constructor(
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    defaultType: config.ConfigDefaultType,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, props);

    this.defaultType = defaultType;
    this.snsStack = snsStack;
  }

  protected setupAlarm(
    localName: string,
    metricName: string,
    localConf: config.ConfigLocal,
    dimensions?: object,
  ): void {
    const autoResolve = config.configAutoResolve(this.defaultType, metricName, localConf?.config);
    const isEnabled = config.configIsEnabled(this.defaultType, metricName, localConf?.config);

    if (!isEnabled) {
      return;
    }

    const metric = new cw.Metric({
      ...getMetricConfig(config.ConfigDefaultType.ApiGateway, metricName),
      dimensions,
    });

    const alarmName = `${localName}-${metricName}`;
    const alarm = metric.createAlarm(this, alarmName, {
      ...getAlarmConfig(config.ConfigDefaultType.ApiGateway, metricName),
      alarmName,
    });

    this.snsStack.addAlarmActions(alarm, autoResolve);
  }
}
