import AWS, { CloudFormation as CloudFormationTypes } from 'aws-sdk';

const Cloudformation = new AWS.CloudFormation();

export type DeployedResource = {
  stackIndex: number;
  resources: string[];
};

const getDeployedStacks = async (): Promise<string[]> => {
  const stackList: CloudFormationTypes.ListStacksOutput = await Cloudformation.listStacks({
    StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE'],
  }).promise();

  if (!stackList.StackSummaries) {
    return [];
  }

  return stackList.StackSummaries.map(singleStack => singleStack.StackName);
};
const getDeployedStackResources = async (stackName: string): Promise<string[]> => {
  const getResources = async (resources: string[], nextToken: string | undefined = undefined): Promise<string[]> => {
    const resourcesChunk = await Cloudformation.listStackResources({
      StackName: stackName,
      NextToken: nextToken,
    }).promise();

    if (!resourcesChunk.StackResourceSummaries) {
      return resources;
    }

    const resourceNames = resourcesChunk.StackResourceSummaries.map(summary => summary.PhysicalResourceId) as string[];
    const allResources = [...resources, ...resourceNames];

    if (resourcesChunk.NextToken) {
      return getResources(allResources, resourcesChunk.NextToken);
    }

    return allResources;
  };

  return getResources([]);
};

const isMonitoredResource = (deployedResourceName: string, monitoredResource: string): boolean => {
  const strippedDeployedResourceName = deployedResourceName.replace(/-[^-]*-[^-]*$/, '');

  return monitoredResource === strippedDeployedResourceName;
};

const getStackResourcesToMonitor = async (
  nestedStackNamePrefix: string,
  deployedStackName: string,
  resourcesToMonitor: string[],
): Promise<DeployedResource> => {
  // @ts-ignore
  const stackIndex = deployedStackName.match(new RegExp(`${nestedStackNamePrefix}(\\d*)`))[1];

  const deployedResources = await getDeployedStackResources(deployedStackName);
  const deployedResourcesToMonitor = deployedResources.reduce((acc: string[], deployedResourceName: string) => {
    const resourceToMonitor = resourcesToMonitor.find(monitoredResource =>
      isMonitoredResource(deployedResourceName, monitoredResource),
    );

    if (resourceToMonitor && !acc.includes(resourceToMonitor)) {
      acc.push(resourceToMonitor);
    }

    return acc;
  }, []);

  return {
    stackIndex: parseInt(stackIndex, 10) - 1,
    resources: deployedResourcesToMonitor,
  };
};

const getDeployedResourcesToMonitor = async (
  resourcesToMonitor: string[],
  nestedStackNamePrefix: string,
): Promise<DeployedResource[]> => {
  const deployedStacks = await getDeployedStacks();
  const deployedMonitoringStackNames = deployedStacks.filter(stackName => {
    return stackName.startsWith(nestedStackNamePrefix);
  });

  return Promise.all(
    deployedMonitoringStackNames.map(deployedStackName => {
      return getStackResourcesToMonitor(nestedStackNamePrefix, deployedStackName, resourcesToMonitor);
    }),
  );
};

export { getDeployedResourcesToMonitor };
