import { aws_cloudwatch as cw } from 'aws-cdk-lib';

export function getComparisonOperator(str?: string): cw.ComparisonOperator {
  if (!str) {
    return cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD;
  }

  switch (str.toUpperCase()) {
    case 'GREATER_THAN_OR_EQUAL_TO_THRESHOLD':
    case '>=':
    case 'gte':
      return cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD;
    case 'GREATER_THAN_THRESHOLD':
    case '>':
    case 'gt':
      return cw.ComparisonOperator.GREATER_THAN_THRESHOLD;
    case 'LESS_THAN_THRESHOLD':
    case '<':
    case 'lt':
      return cw.ComparisonOperator.LESS_THAN_THRESHOLD;
    case 'LESS_THAN_OR_EQUAL_TO_THRESHOLD':
    case '<=':
    case 'lte':
      return cw.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD;
    case 'GREATER_THAN_UPPER_THRESHOLD':
      return cw.ComparisonOperator.GREATER_THAN_UPPER_THRESHOLD;
    case 'LESS_THAN_LOWER_OR_GREATER_THAN_UPPER_THRESHOLD':
      return cw.ComparisonOperator.LESS_THAN_LOWER_OR_GREATER_THAN_UPPER_THRESHOLD;
    case 'LESS_THAN_LOWER_THRESHOLD':
      return cw.ComparisonOperator.LESS_THAN_LOWER_THRESHOLD;
    default:
      return cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD;
  }
}

/**
 * Convert string to TreatMissingData enum
 *
 * Default value: NOT_BREACHING
 */
export function getTreatMissingData(str?: string): cw.TreatMissingData {
  if (!str) {
    return cw.TreatMissingData.NOT_BREACHING;
  }

  switch (str.toUpperCase()) {
    case 'BREACHING':
      return cw.TreatMissingData.BREACHING;
    case 'NOT_BREACHING':
      return cw.TreatMissingData.NOT_BREACHING;
    case 'IGNORE':
      return cw.TreatMissingData.IGNORE;
    case 'MISSING':
      return cw.TreatMissingData.MISSING;
    default:
      return cw.TreatMissingData.NOT_BREACHING;
  }
}
