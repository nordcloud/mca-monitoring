import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cw from '@aws-cdk/aws-cloudwatch';

import { NestedSNSStack } from './nestedSns';
import { getAlarmConfig, getMetricConfig, MetricNamespace } from '../utils';
import { ConfigMetricAlarmName } from '../utils/types';

export interface SetupAlarmOpts {
  aliases?: string[];
}

export interface BaseNestedStackProps extends cfn.NestedStackProps {
  snsStack?: NestedSNSStack;
}

export default class BaseNestedStack extends cfn.NestedStack {
  protected readonly snsStack?: NestedSNSStack;

  constructor(scope: cdk.Construct, id: string, props: BaseNestedStackProps) {
    super(scope, id, props);
    this.snsStack = props.snsStack;
  }

  protected setupAlarm(props: ConfigMetricAlarmName, namespace: MetricNamespace, dimensions?: cw.DimensionHash): void {
    if (!props.enabled) {
      return;
    }

    const metricName = `${props.resourceName}-${props.metricName}`;
    const metric = new cw.Metric({
      ...getMetricConfig(metricName, namespace, props?.metric),
      dimensions,
    });

    const alarmName = `${props.resourceName}-${props.metricName}`;
    const alarm = metric.createAlarm(this, alarmName, getAlarmConfig(alarmName, props?.alarm));

    if (this.snsStack) {
      this.snsStack.addAlarmActions(alarm, props.autoResolve);
    }
  }
}
