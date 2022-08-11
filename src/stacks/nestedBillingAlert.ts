import * as cdk from 'aws-cdk-lib';
import { 
  aws_cloudwatch as cw, 
  aws_budgets as b 
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as config from '../utils/config';

import { NestedSNSStack } from './nestedSns';

import { getTreatMissingData, getComparisonOperator } from '../utils/alarm';
import { getDuration } from '../utils/metric';

// Generate nested stack for billing alerts
export class NestedBillingAlertStack extends cdk.NestedStack {
  protected readonly snsStack: NestedSNSStack;

  constructor(scope: Construct, id: string, snsStack: NestedSNSStack, props?: cdk.NestedStackProps) {
    super(scope, id, props);

    this.snsStack = snsStack;
    const billingAlert = config.configGetBillingAlert() || null;

    if (billingAlert && config.configIsEnabled(billingAlert)) {
      Object.keys(billingAlert.alarm || {}).forEach(topic => {
        const conf = billingAlert.alarm?.[topic];
        if (conf && conf.enabled !== false) {
          this.createAnomalyDetectionAlarm(id, billingAlert, topic);
          this.createBudgetAlarm(id, conf, topic);
        }
      });
    }
  }

  private createBudgetAlarm(id: string, alarmOpts: config.BillingAlertAlarmOptions, topic: string): void {
    const budgetName = `${id}-${topic}-budget`;
    const topicArn = cdk.Token.asString(this.snsStack.getTopicArn(topic));

    const budgetParams: b.CfnBudgetProps = {
      budget: {
        budgetName: budgetName,
        budgetType: 'COST',
        budgetLimit: {
          amount: alarmOpts.budgetLimit,
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
          subscribers: [
            {
              subscriptionType: 'SNS',
              address: topicArn,
            },
          ],
        },
      ],
    };

    new b.CfnBudget(this, budgetName, budgetParams);
  }

  private createAnomalyDetectionAlarm(id: string, billingAlert: config.ConfigCustomBillingAlert, topic: string): void {
    const topicArn = cdk.Token.asString(this.snsStack.getTopicArn(topic));
    const conf = billingAlert.alarm?.[topic];

    if (conf && conf.enabled !== false) {
      const metricName = 'EstimatedCharges';
      const anomalyDetectorName = `${id}-${topic}-anomaly-detector`;
      const anomalyDetectorParams: cw.CfnAnomalyDetectorProps = {
        metricName,
        namespace: 'AWS/Billing',
        stat: billingAlert.metric?.statistic || 'Maximum',
        configuration: {
          metricTimeZone: 'UTC',
        },
      };
      new cw.CfnAnomalyDetector(this, anomalyDetectorName, anomalyDetectorParams);

      const alarmName = `${anomalyDetectorName}-${anomalyDetectorParams.metricName}`;
      const anomalyDetectorAlarmParams: cw.CfnAlarmProps = {
        alarmName,
        actionsEnabled: true,
        ...conf,
        alarmActions: [topicArn],
        okActions: billingAlert.autoResolve ? [topicArn] : [],
        thresholdMetricId: 'ad1',
        treatMissingData: getTreatMissingData(conf?.treatMissingData),
        comparisonOperator: getComparisonOperator(conf?.comparisonOperator),
        metrics: [
          {
            expression: 'ANOMALY_DETECTION_BAND(m1, 1)',
            id: 'ad1',
          },
          {
            metricStat: {
              metric: {
                ...anomalyDetectorParams,
                dimensions: [
                  {
                    name: 'Currency',
                    value: 'USD',
                  },
                ],
              },
              stat: anomalyDetectorParams.stat!,
              period: getDuration(billingAlert.metric?.period).toSeconds(),
            },
            id: 'm1',
          },
        ],
      };
      new cw.CfnAlarm(this, `${anomalyDetectorName}-alarm`, anomalyDetectorAlarmParams);
    }
  }
}

export function createBillingAlertStack(stack: cdk.Stack, snsStack: NestedSNSStack): NestedBillingAlertStack {
  return new NestedBillingAlertStack(stack, stack.stackName + '-billing-alert', snsStack);
}
