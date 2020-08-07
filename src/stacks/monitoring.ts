import * as cdk from '@aws-cdk/core';
import * as cw from '@aws-cdk/aws-cloudwatch';

import { setAWSCredentials } from '../aws-sdk';
import { createSNSStack, NestedSNSStack, NestedSNSStackProps } from './nestedSns';
import { createLambdaMonitoring, NestedLambdaAlarmsStack, LambdaProps } from './nestedLambda';
import { createDynamoDBMonitoring, NestedDynamoDBAlarmsStack, DynamoDBProps } from './nestedDynamoDB';
import { createAccountMonitoring, NestedAccountAlarmsStack, AccountProps } from './nestedAccount';
import { createECSMonitoring, NestedECSAlarmsStack, ECSProps } from './nestedECS';
import { createApiGatewayMonitoring, NestedApiGatewayAlarmsStack, ApiGatewayProps } from './nestedApiGateway';
import { createCloudFrontMonitoring, NestedCloudFrontAlarmsStack, CloudFrontProps } from './nestedCloudFront';
import { createRDSMonitoring, NestedRDSAlarmsStack, RDSProps } from './nestedRDS';
import { createEKSMonitoring, NestedEKSAlarmsStack, EKSProps } from './nestedEKS';

export interface MonitoringStackProps extends cdk.StackProps {
  profile?: string;
  region?: string;
  sns?: NestedSNSStackProps;
}

// Generate stack with two nested stacks
export class MonitoringStack extends cdk.Stack {
  private snsStack?: NestedSNSStack;

  constructor(scope: cdk.Construct, id: string, props?: MonitoringStackProps) {
    super(scope, id, props);

    // Set AWS credentials ready for later requests
    setAWSCredentials(props?.profile, props?.region);

    // Setup SNS topics and actions
    if (props?.sns) {
      this.snsStack = createSNSStack(this, props.sns);
    }
  }

  /**
   * Get SNS stack for other monitoring
   */
  public getSnsStack(): NestedSNSStack | undefined {
    return this.snsStack;
  }

  /**
   * Setup lambda monitoring
   */
  public async addDefaultLambdaMonitoring(props: LambdaProps): Promise<NestedLambdaAlarmsStack[]> {
    if (!props?.snsStack) {
      props.snsStack = this.snsStack;
    }
    return createLambdaMonitoring(this, props);
  }

  /**
   * Setup dynamodb monitoring
   */
  public async addDefaultDynamoDBMonitoring(props: DynamoDBProps): Promise<NestedDynamoDBAlarmsStack[]> {
    if (!props?.snsStack) {
      props.snsStack = this.snsStack;
    }
    return createDynamoDBMonitoring(this, props);
  }

  /**
   * Setup account monitoring
   */
  public async addDefaultAccountMonitoring(props: AccountProps): Promise<NestedAccountAlarmsStack[]> {
    if (!props?.snsStack) {
      props.snsStack = this.snsStack;
    }
    return createAccountMonitoring(this, props);
  }

  /**
   * Setup cluster monitoring
   */
  public addDefaultECSClusterMonitoring(props: ECSProps): Promise<NestedECSAlarmsStack[]> {
    if (!props?.snsStack) {
      props.snsStack = this.snsStack;
    }
    return createECSMonitoring(this, props);
  }

  /**
   * Setup Api Gateway monitoring
   */
  public async addDefaultApiGatewayMonitoring(props: ApiGatewayProps): Promise<NestedApiGatewayAlarmsStack[]> {
    if (!props?.snsStack) {
      props.snsStack = this.snsStack;
    }
    return createApiGatewayMonitoring(this, props);
  }

  /**
   * Setup Cloudfront monitoring
   */
  public async addDefaultCloudFrontMonitoring(props: CloudFrontProps): Promise<NestedCloudFrontAlarmsStack[]> {
    if (!props?.snsStack) {
      props.snsStack = this.snsStack;
    }
    return createCloudFrontMonitoring(this, props);
  }

  /**
   * Setup RDS monitoring
   */
  public async addDefaultRDSMonitoring(props: RDSProps): Promise<NestedRDSAlarmsStack[]> {
    if (!props?.snsStack) {
      props.snsStack = this.snsStack;
    }
    return createRDSMonitoring(this, props);
  }

  /**
   * Setup EKS monitoring
   */
  public async addDefaultEKSMonitoring(props: EKSProps): Promise<NestedEKSAlarmsStack[]> {
    if (!props?.snsStack) {
      props.snsStack = this.snsStack;
    }
    return createEKSMonitoring(this, props);
  }

  /**
   * Add custom metric and alarm
   *
   * This function doesn't automatically attach alarm to topic
   */
  public addCustomAlarmMetric(metricProps: cw.MetricProps, alarmProps: cw.AlarmProps, scope?: cdk.Construct): cw.Alarm {
    const metric = new cw.Metric(metricProps);
    return metric.createAlarm(scope || this, alarmProps.alarmName || '', alarmProps);
  }

  /**
   * Add custom alarm to SNS stack
   */
  public addAlarmToSNS(alarm: cw.Alarm, autoResolve?: boolean): void {
    this.snsStack?.addAlarmActions(alarm, autoResolve);
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
