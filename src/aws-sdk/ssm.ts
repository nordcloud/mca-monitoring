import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';

export async function getSSMParameter(name: string, withDecryption = false): Promise<string | undefined> {
  validateCredentials();

  const ssm = new AWS.SSM();

  const params = {
    Name: name,
    WithDecryption: withDecryption,
  };

  const res = await ssm.getParameter(params).promise();
  return res.Parameter?.Value;
}
