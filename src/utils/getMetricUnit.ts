import { Unit } from '@aws-cdk/aws-cloudwatch';

export default function getMetricUnit(str?: keyof typeof Unit): Unit | undefined {
  if (!str) {
    return undefined;
  }

  return Unit[str];
}
