import { DeployedResource } from './cloudfront';

const DELIMITER = 30;

const fillChunks = (
  chunks: string[][],
  resourcesToAdd: string[], // @ts-ignore
): string[][] => {
  const allResourcesFromChunks = chunks.reduce((acc: string[], chunk: string[]) => [...acc, ...chunk], []);
  const resourceCount = allResourcesFromChunks.length + resourcesToAdd.length;
  const expectedChunkCount = Math.ceil(resourceCount / DELIMITER);

  if (resourcesToAdd.length === 0) {
    return chunks;
  }

  for (let i = 0; i < expectedChunkCount; i++) {
    chunks[i] = chunks[i] || [];
    const resourcesToAddCount = DELIMITER - chunks[i].length;

    if (resourcesToAddCount > 0) {
      chunks[i].push(...resourcesToAdd.slice(0, resourcesToAddCount));

      return fillChunks(chunks, resourcesToAdd.slice(resourcesToAddCount));
    }
  }
};

const getFilledChunks = (
  indexedDeployedResourcesToMonitor: DeployedResource[],
  resourcesToMonitor: string[],
): string[][] => {
  const chunksWithDeployedResources = indexedDeployedResourcesToMonitor.reduce((acc: string[][], stackResources) => {
    if (stackResources.resources.length > 0) {
      acc[stackResources.stackIndex] = stackResources.resources;
    }

    return acc;
  }, []);

  const allResourcesFromChunks = chunksWithDeployedResources.reduce(
    (acc: string[], chunk: string[]) => [...acc, ...chunk],
    [],
  );
  const notDeployedResourcesToAdd = resourcesToMonitor.filter(
    resourceName => !allResourcesFromChunks.includes(resourceName),
  );

  return fillChunks(chunksWithDeployedResources, notDeployedResourcesToAdd);
};

export { getFilledChunks };
