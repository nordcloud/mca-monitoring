import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { match } from '../utils';

export async function getRoutes(include?: string[], exclude?: string[]): Promise<AWS.APIGateway.RestApi[]> {
  validateCredentials();

  const gateway = new AWS.APIGateway();

  const res = await gateway.getRestApis().promise();
  return (res?.items || []).filter(r => match(r.name || '', include, exclude));
}
