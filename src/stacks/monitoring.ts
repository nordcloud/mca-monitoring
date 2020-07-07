import * as cdk from '@aws-cdk/core';
import { createSNSStack, NestedSNSStack } from './nestedSns';
import { createLambdaMonitoring, NestedLambdaAlarmsStack } from './nestedLambda';
import { createDynamoDBMonitoring, NestedTableAlarmsStack } from './nestedTable';
import { createAccountAlarms, NestedAccountAlarmsStack } from './nestedAccount';
import { createClusterAlarms, NestedClusterAlarmsStack } from './nestedECS';
import { createApiGatewayAlarms, NestedApiGatewayAlarmsStack } from './nestedApiGateway';
import { createCloudFrontAlarms, NestedCloudFrontAlarmsStack } from './nestedCloudFront';
import { createRDSMonitoring, NestedRDSAlarmsStack } from './nestedRDS';
import { createEKSMonitoring, NestedEKSAlarmsStack } from './nestedEKS';

// Generate stack with two nested stacks
export class MonitoringStack extends cdk.Stack {
  private snsStack: NestedSNSStack;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Setup SNS topics and actions
    this.snsStack = createSNSStack(this);
  }

  /**
   * Get SNS stack for other monitoring
   */
  public getSnsStack(): NestedSNSStack {
    return this.snsStack;
  }

  /**
   * Setup lambda monitoring
   */
  public addDefaultLambdaMonitoring(): NestedLambdaAlarmsStack[] {
    return createLambdaMonitoring(this, this.snsStack);
  }

  /**
   * Setup dynamodb monitoring
   */
  public addDefaultDynamoDBMonitoring(): NestedTableAlarmsStack[] {
    return createDynamoDBMonitoring(this, this.snsStack);
  }

  /**
   * Setup account monitoring
   */
  public addDefaultAccountMonitoring(): NestedAccountAlarmsStack[] {
    return createAccountAlarms(this, this.snsStack);
  }

  /**
   * Setup cluster monitoring
   */
  public addDefaultClusterMonitoring(): NestedClusterAlarmsStack[] {
    return createClusterAlarms(this, this.snsStack);
  }

  /**
   * Setup Api Gateway monitoring
   */
  public addDefaultApiGatewayMonitoring(): NestedApiGatewayAlarmsStack[] {
    return createApiGatewayAlarms(this, this.snsStack);
  }

  /**
   * Setup Cloudfront monitoring
   */
  public addDefaultCloudFrontMonitoring(): NestedCloudFrontAlarmsStack[] {
    return createCloudFrontAlarms(this, this.snsStack);
  }

  /**
   * Setup RDS monitoring
   */
  public addDefaultRDSMonitoring(): NestedRDSAlarmsStack[] {
    return createRDSMonitoring(this, this.snsStack);
  }

  /**
   * Setup EKS monitoring
   */
  public addDefaultEKSMonitoring(): NestedEKSAlarmsStack[] {
    return createEKSMonitoring(this, this.snsStack);
  }
}

/**
 * Setup default CDK app
 */
export function createApp(): cdk.Construct {
  return new cdk.App();
}

/**
 * Generate monitoring stack
 */
export function setupMonitoringStack(app: cdk.Construct, id: string): MonitoringStack {
  return new MonitoringStack(app, id);
}
