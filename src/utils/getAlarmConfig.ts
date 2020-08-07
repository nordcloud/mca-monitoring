import { CreateAlarmOptions } from '@aws-cdk/aws-cloudwatch';

import { AlarmOptions } from './types';

export default function getAlarmConfig(alarmName: string, props?: AlarmOptions): CreateAlarmOptions {
  return {
    // Add required default values
    threshold: 100,
    evaluationPeriods: 2,

    // Add props values
    ...(props || {}),

    // Make sure props doesn't override these
    actionsEnabled: true,
    alarmName,
  } as CreateAlarmOptions;
}
