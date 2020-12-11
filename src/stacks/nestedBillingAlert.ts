import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cw from '@aws-cdk/aws-cloudwatch';
import * as b from '@aws-cdk/aws-budgets';

import * as config from '../utils/config';

import { CfnBudget, CfnBudgetProps } from '@aws-cdk/aws-budgets';
import { CfnAlarmProps, CfnAnomalyDetectorProps } from '@aws-cdk/aws-cloudwatch';
import { NestedSNSStack } from './nestedSns';

const subscribers: Array<CfnBudget.SubscriberProperty> = [];
const topicArns: Array<string> = [];

// Generate nested stack for sns topics
export class NestedBillingAlertStack extends cfn.NestedStack {
  constructor(scope: cdk.Construct, id: string, snsStack: NestedSNSStack, props?: cfn.NestedStackProps) {
    super(scope, id, props);

    const billingAlert = config.configGetBillingAlert() || null;
    const topics = config.configGetSNSTopics() || {};

    if (billingAlert && config.configIsEnabled(billingAlert)) {
      Object.keys(topics).forEach(topic => {
        const topicArn = cdk.Token.asString(snsStack.getTopicArn(topic));
        subscribers.push({
          subscriptionType: 'SNS',
          address: topicArn,
        });
        topicArns.push(topicArn);
      });

      this.createAnomalyDetectionAlarm(id);
      this.createBudgetAlarm(id, billingAlert.limit);
    }
  }

  private createBudgetAlarm(id: string, limit: number): void {
    const budgetName = `${id}-budget`;

    const budgetParams: CfnBudgetProps = {
      budget: {
        budgetName: budgetName,
        budgetType: 'COST',
        budgetLimit: {
          amount: limit,
          unit: 'USD',
        },
        timeUnit: 'MONTHLY',
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 100,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: subscribers,
        },
      ],
    };

    new b.CfnBudget(this, budgetName, budgetParams);
  }

  private createAnomalyDetectionAlarm(id: string): void {
    const anomalyDetectorName = `${id}-anomaly-detector`;

    const anomalyDetectorParams: CfnAnomalyDetectorProps = {
      metricName: `${id}-estimated-charges`,
      namespace: 'AWS/Billing',
      stat: 'Maximum',
      dimensions: [
        {
          name: 'Currency',
          value: 'USD',
        },
      ],
      configuration: {
        metricTimeZone: 'UTC',
      },
    };

    new cw.CfnAnomalyDetector(this, anomalyDetectorName, anomalyDetectorParams);

    const anomalyDetectorAlarmParams: CfnAlarmProps = {
      alarmName: `${anomalyDetectorName}-alarm`,
      actionsEnabled: true,
      alarmActions: topicArns,
      alarmDescription:
        'Anomaly detection is the process of identifying unexpected items or events in data sets, which differ from the normal',
      evaluationPeriods: 1,
      comparisonOperator: 'GreaterThanUpperThreshold',
      thresholdMetricId: 'ad1',
      metrics: [
        {
          expression: 'ANOMALY_DETECTION_BAND(m1, 1)',
          id: 'ad1',
        },
        {
          metricStat: {
            metric: {
              metricName: anomalyDetectorParams.metricName,
              namespace: anomalyDetectorParams.namespace,
              dimensions: anomalyDetectorParams.dimensions,
            },
            stat: anomalyDetectorParams.stat,
            period: 21600, // 6 hours
          },
          id: 'm1',
        },
      ],
    };

    new cw.CfnAlarm(this, `${anomalyDetectorName}-alarm`, anomalyDetectorAlarmParams);
  }
}

export function createBillingAlertStack(stack: cdk.Stack, snsStack: NestedSNSStack): NestedBillingAlertStack {
  return new NestedBillingAlertStack(stack, stack.stackName + '-billing-alert', snsStack);
}
