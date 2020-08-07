import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { match } from '../utils';

export async function getRDSInstances(include?: string[], exclude?: string[]): Promise<AWS.RDS.DBInstanceList> {
  validateCredentials();

  const rds = new AWS.RDS();

  const res = await rds.describeDBInstances().promise();

  return (res.DBInstances || []).filter(
    ({ DBInstanceIdentifier }) => DBInstanceIdentifier && match(DBInstanceIdentifier, include, exclude),
  );
}
