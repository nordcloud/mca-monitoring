import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { match } from '../utils';

export async function getTables(include?: string[], exclude?: string[]): Promise<AWS.DynamoDB.TableNameList> {
  validateCredentials();

  const dynamodb = new AWS.DynamoDB();
  const res = await dynamodb.listTables().promise();
  return (res.TableNames || []).filter(t => match(t, include, exclude));
}
