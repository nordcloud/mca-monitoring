import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { match } from '../utils';

export async function getLambdas(include?: string[], exclude?: string[]): Promise<AWS.Lambda.FunctionList> {
  validateCredentials();

  const lambda = new AWS.Lambda();

  const res = await lambda.listFunctions().promise();
  return (res?.Functions || []).filter(f => match(f.FunctionName || '', include, exclude));
}
