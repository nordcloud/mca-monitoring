import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { match, chunk } from '../utils';

export async function getECSClusters(include?: string[], exclude?: string[]): Promise<AWS.ECS.Clusters> {
  validateCredentials();

  const ecs = new AWS.ECS();

  // Get cluster arns
  const res = await ecs.listClusters().promise();

  // Split to 100 cluster list and run describe
  const clusters = await Promise.all(
    chunk(res.clusterArns || [], 100).map(async clusters => {
      const describeResponse = await ecs.describeClusters({ clusters }).promise();
      return describeResponse.clusters || [];
    }),
  );

  // Combine clusters back to single list and filter
  return clusters.reduce((acc, c) => [...acc, ...c], []).filter(t => t && match(t.clusterName || '', include, exclude));
}
