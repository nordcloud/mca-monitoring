import { Stack, StackProps, App } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { createSNSStack, NestedSNSStack } from './nestedSns';
import { createLambdaMonitoring, NestedLambdaAlarmsStack } from './nestedLambda';
import { createDynamoDBMonitoring, NestedTableAlarmsStack } from './nestedTable';
import { createAccountAlarms, NestedAccountAlarmsStack } from './nestedAccount';
import { createClusterAlarms, NestedClusterAlarmsStack } from './nestedECS';
import { createApiGatewayAlarms, NestedApiGatewayAlarmsStack } from './nestedApiGateway';
import { createCloudFrontAlarms, NestedCloudFrontAlarmsStack } from './nestedCloudFront';
import { createRDSMonitoring, NestedRDSAlarmsStack } from './nestedRDS';
import { createEKSMonitoring, NestedEKSAlarmsStack } from './nestedEKS';
import { createLogGroupMonitoring, NestedLogGroupAlarmsStack, LogGroupsProps } from './nestedLogGroup';
import { createBillingAlertStack, NestedBillingAlertStack } from './nestedBillingAlert';
import { createAppSyncMonitoring, NestedAppSyncAlarmsStack } from './nestedAppSync';
import { createSQSMonitoring, NestedSQSAlarmsStack } from './nestedSQS';

// Generate stack with two nested stacks
export class MonitoringStack extends Stack {
  private snsStack: NestedSNSStack;
  private versionReportingEnabled = false;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.versionReportingEnabled = this.node.tryGetContext('aws:cdk:version-reporting') === true;

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
   * Setup billing alert
   */
  public addBillingAlert(): NestedBillingAlertStack {
    return createBillingAlertStack(this, this.snsStack);
  }

  /**
   * Setup lambda monitoring
   */
  public addDefaultLambdaMonitoring(): NestedLambdaAlarmsStack[] {
    return createLambdaMonitoring(this, this.snsStack, this.versionReportingEnabled);
  }

  /**
   * Setup AppSync monitoring
   */
  public addDefaultAppSyncMonitoring(): NestedAppSyncAlarmsStack[] {
    return createAppSyncMonitoring(this, this.snsStack, this.versionReportingEnabled);
  }

  /**
   * Setup dynamodb monitoring
   */
  public addDefaultDynamoDBMonitoring(): NestedTableAlarmsStack[] {
    return createDynamoDBMonitoring(this, this.snsStack, this.versionReportingEnabled);
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
    return createClusterAlarms(this, this.snsStack, this.versionReportingEnabled);
  }

  /**
   * Setup Api Gateway monitoring
   */
  public addDefaultApiGatewayMonitoring(): NestedApiGatewayAlarmsStack[] {
    return createApiGatewayAlarms(this, this.snsStack, this.versionReportingEnabled);
  }

  /**
   * Setup Cloudfront monitoring
   */
  public addDefaultCloudFrontMonitoring(): NestedCloudFrontAlarmsStack[] {
    return createCloudFrontAlarms(this, this.snsStack, this.versionReportingEnabled);
  }

  /**
   * Setup RDS monitoring
   */
  public addDefaultRDSMonitoring(): NestedRDSAlarmsStack[] {
    return createRDSMonitoring(this, this.snsStack, this.versionReportingEnabled);
  }

  /**
   * Setup EKS monitoring
   */
  public addDefaultEKSMonitoring(): NestedEKSAlarmsStack[] {
    return createEKSMonitoring(this, this.snsStack, this.versionReportingEnabled);
  }

  /**
   * Setup Log Group monitoring
   */
  public addDefaultLogGroupMonitoring(props?: LogGroupsProps): NestedLogGroupAlarmsStack[] {
    return createLogGroupMonitoring(this, this.snsStack, props, this.versionReportingEnabled);
  }

  /**
   * Setup SQS monitoring
   */
   public addDefaultSQSMonitoring(): NestedSQSAlarmsStack[] {
    return createSQSMonitoring(this, this.snsStack, this.versionReportingEnabled);
  }
}

/**
 * Setup default CDK app
 */
export function createApp(): Construct {
  return new App();
}

/**
 * Generate monitoring stack
 */
export function setupMonitoringStack(app: Construct, id: string, props?: StackProps): MonitoringStack {
  if (!props?.stackName) {
    props = {
      ...(props || {}),
      stackName: id,
    };
  }
  return new MonitoringStack(app, id, props);
}
