import { TreatMissingData } from '@aws-cdk/aws-cloudwatch';

/**
 * Convert string to TreatMissingData enum
 *
 * Default value: NOT_BREACHING
 */
export default function getTreatMissingData(str?: keyof typeof TreatMissingData): TreatMissingData {
  if (!str) {
    return TreatMissingData.NOT_BREACHING;
  }
  return TreatMissingData[str];
}
