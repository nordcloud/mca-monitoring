import { CreateAlarmOptions } from '@aws-cdk/aws-cloudwatch';

import getTreatMissingData from './getTreatMissingData';
import getComparisonOperator from './getComparisonOperator';
import { AlarmOptions } from './types';

export default function getAlarmConfig(alarmName: string, props?: AlarmOptions): CreateAlarmOptions {
  return {
    // Add required default values
    threshold: 100,
    evaluationPeriods: 2,

    // Add props values
    ...(props || {}),

    // Make sure props doesn't override these
    treatMissingData: getTreatMissingData(props?.treatMissingData),
    comparisonOperator: getComparisonOperator(props?.comparisonOperator),
    actionsEnabled: true,
    alarmName,
  } as CreateAlarmOptions;
}
