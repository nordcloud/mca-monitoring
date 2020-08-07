import { ComparisonOperator } from '@aws-cdk/aws-cloudwatch';

export default function getComparisonOperator(str?: keyof typeof ComparisonOperator): ComparisonOperator {
  if (!str) {
    return ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD;
  }
  return ComparisonOperator[str];
}
