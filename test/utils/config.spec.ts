import test from 'ava';

import * as config from '../../src/utils/config';
import { lambdaMetrics } from '../../src/stacks/nestedLambda';

const testConfig = `
cli:
  version: 1
  profile: test
  services:
    - lambda
    - dynamodb
  includes: []
  excludes: []
lambdas:
  lambda-1:
    Errors:
      enabled: true
  lambda-2: {}
tables:
  table-1: {}
clusters:
  cluster-1: {}
routes:
  route-1: {}
custom:
  default:
    lambda:
      Errors:
        enabled: false
        alarm:
          treatMissingData: 'NOT_BREACHING'
          threshold: 10
          evaluationPeriods: 1
        metric:
          period:
            minutes: 5
          statistic: Sum
      Invocations:
        enabled: false
        alarm:
          treatMissingData: 'NOT_BREACHING'
          threshold: 200
          evaluationPeriods: 1
        metric:
          period:
            minutes: 5
          statistic: Sum
      Duration:
        enabled: false
        alarm:
          treatMissingData: 'NOT_BREACHING'
          threshold: 2000
          evaluationPeriods: 1
        metric:
          period:
            minutes: 5
          statistic: Maximum
      Throttles:
        enabled: false
        alarm:
          treatMissingData: 'NOT_BREACHING'
          threshold: 10
          evaluationPeriods: 1
        metric:
          period:
            minutes: 5
          statistic: Sum
    table:
      ConsumedReadCapacityUnits:
        enabled: true
        alarm:
          treatMissingData: 'NOT_BREACHING'
          threshold: 10
          evaluationPeriods: 5
        metric:
          period:
            minutes: 5
          statistic: Maximum
      ConsumedWriteCapacityUnits:
        enabled: true
        alarm:
          treatMissingData: 'NOT_BREACHING'
          threshold: 200
          evaluationPeriods: 5
        metric:
          period:
            minutes: 5
          statistic: Maximum
      ProvisionedReadCapacity:
        enabled: true
        alarm:
          treatMissingData: 'NOT_BREACHING'
          threshold: 2000
          evaluationPeriods: 5
        metric:
          period:
            minutes: 5
          statistic: Maximum
      ProvisionedWriteCapacity:
        enabled: true
        alarm:
          treatMissingData: 'NOT_BREACHING'
          threshold: 10
          evaluationPeriods: 5
        metric:
          period:
            minutes: 5
          statistic: Maximum
      ConditionalCheckFailedRequests:
        enabled: false
      MaxProvisionedTableReadCapacityUtilization:
        enabled: false
      MaxProvisionedTableWriteCapacityUtilization:
        enabled: false
      OnlineIndexConsumedWriteCapacity:
        enabled: false
      OnlineIndexPercentageProgress:
        enabled: false
      OnlineIndexThrottleEvents:
        enabled: false
      PendingReplicationCount:
        enabled: false
      ReadThrottleEvents:
        enabled: false
      ReplicationLatency:
        enabled: false
      ReturnedBytes:
        enabled: false
      ReturnedItemCount:
        enabled: false
      ReturnedRecordsCount:
        enabled: false
      SystemErrors:
        enabled: false
      TimeToLiveDeletedItemCount:
        enabled: false
      ThrottledRequests:
        enabled: false
      TransactionConflict:
        enabled: false
      WriteThrottleEvents:
        enabled: false
    account:
      AccountMaxReads:
        enabled: false
      AccountMaxTableLevelReads:
        enabled: false
      AccountMaxTableLevelWrites:
        enabled: false
      AccountMaxWrites:
        enabled: false
      AccountProvisionedReadCapacityUtilization:
        enabled: false
      AccountProvisionedWriteCapacityUtilization:
        enabled: false
      UserErrors:
        enabled: false
  snsTopics:
    name: test topic
    id: test-topic
    endpoints: []
    emails:
      - application-management@nordcloud.com
`;
config.loadConfigString(testConfig);

test('find all lambdas', t => {
  const all = config.configGetAll(config.ConfigLocalType.Lambda);
  t.is(Object.keys(all).length, 2);
});

test('find only enabled lambdas', t => {
  const enabled = config.configGetAllEnabled(config.ConfigLocalType.Lambda, lambdaMetrics);
  t.is(Object.keys(enabled).length, 1);
});
