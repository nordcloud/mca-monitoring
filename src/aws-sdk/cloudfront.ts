import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { match } from '../utils';

export async function getDistributions(
  include?: string[],
  exclude?: string[],
): Promise<AWS.CloudFront.DistributionSummary[]> {
  validateCredentials();

  const cf = new AWS.CloudFront();

  const res = await cf.listDistributions().promise();

  return (res?.DistributionList?.Items || []).filter(d => {
    const aliases = d.Aliases?.Items || [];
    const filtered = aliases.filter(a => match(a, include, exclude));
    return match(d.Id, include, exclude) || filtered.length !== 0;
  });
}
