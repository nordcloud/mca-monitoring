import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';

export async function getLogGroups(): Promise<AWS.CloudWatchLogs.LogGroup[]> {
  validateCredentials();

  const logs = new AWS.CloudWatchLogs();

  const res = await logs.describeLogGroups().promise();
  return res.logGroups || [];
}

export async function setLogGroupRetention(logGroupName: string, retentionInDays: number): Promise<void> {
  validateCredentials();

  const logs = new AWS.CloudWatchLogs();

  const params = {
    logGroupName,
    retentionInDays,
  };

  await logs.putRetentionPolicy(params).promise();
}
