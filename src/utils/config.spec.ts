import test from 'ava';

import * as config from './config';
import { lambdaMetrics } from '../stacks/nestedLambda';

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
    arn: 'arn:aws:lambda:eu-west-1:id:function:lambda-1'
    config:
      errors:
        enabled: true
  lambda-2:
    arn: 'arn:aws:lambda:eu-west-1:id:function:lambda-2'
    config: {}
tables:
  table-1:
    arn: 'arn:aws:dynamodb:eu-west-1:id:table/table-1'
    config: {}
clusters:
  cluster-1:
    arn: 'arn:aws:ecs:eu-west-1:id:cluster/cluster-1'
    config: {}
routes:
  route-1:
    arn: 'arn:aws:apigateway:eu-west-1:id:route/route-1'
    config: {}
custom:
  default:
    lambda:
      errors:
        enabled: false
        alarm:
          treatMissingData: 'NOT_BREACHING'
          threshold: 10
          evaluationPeriods: 5
      invocations:
        enabled: false
        alarm:
          treatMissingData: 'NOT_BREACHING'
          threshold: 200
          evaluationPeriods: 5
      duration:
        enabled: false
        alarm:
          treatMissingData: 'NOT_BREACHING'
          threshold: 2000
          evaluationPeriods: 5
      throttles:
        enabled: false
        alarm:
          treatMissingData: 'NOT_BREACHING'
          threshold: 10
          evaluationPeriods: 5
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
