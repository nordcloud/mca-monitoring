import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { match } from '../utils';

export async function getEKSClusters(include?: string[], exclude?: string[]): Promise<AWS.EKS.StringList> {
  validateCredentials();

  const eks = new AWS.EKS();

  const res = await eks.listClusters().promise();
  return (res.clusters || []).filter(c => match(c, include, exclude));
}
