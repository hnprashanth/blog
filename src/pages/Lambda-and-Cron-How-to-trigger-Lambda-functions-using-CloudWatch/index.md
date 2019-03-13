---
title: How to trigger Lambda functions periodically or at a spesific time using CloudWatch
date: '2019-03-13'
spoiler: One of the common questions I get asked while talking about serverless is "can we do Cron"?. The answer was always a "Yes" but often I see the other person not convinced!
---
One of the common questions I get asked while talking about serverless is "can we do CRON"?. The answer was always a "Yes" but often I see the other person not convinced! In this blog let's explore how do we acheive this using AWS CloudWatch.

## Using Console

Creating periodic triggers to Lambda using AWS Console is quite simple and straight-forward.

- Login to console and navigate to CloudWatch.
- Under Events, select Rules & click "Create Rule"
- You can either select fixed rate or select Cron Expression for more control
- Cron expression in CloudWatch starts from minutes not seconds, important to remember if you are copying Cron expression from somewhere else.
- Click "Add Target", select "Lambda Function" from drop down & then select appropriate Lambda function.
- If you want to pass some data to the target function when triggered, you can do so by expanding "Configure Input"

That is all, your function will get triggered as per your configuration above.

## Programmatically using SDK

If you want to setup triggers often or based on some business logic then doing it through console may not be a viable option. In this example below we will be using AWS Javascript SDK and learn how to do it programmatically. Before we proceed, we need to understand all the steps the console process above took care of.

- Create New Rule with a Cron Expression
- Add Target as Lambda Function
- Configure data to be passed to Lambda Function when triggered
- Add CloudWatch Rule as authorised trigger source for the Lambda Function (console does this behind the scenes, but we need to do manually)

Let's start by creating the CloudWatch Rule

```javascript
// Load the AWS SDK for Node.js
var AWS = require("aws-sdk");
// Set the region
AWS.config.update({ region: "ap-south-1" });

// Create CloudWatchEvents service object
var cwevents = new AWS.CloudWatchEvents({ apiVersion: "2015-10-07" });
// Create Lamda object
var lambda = new AWS.Lambda();

var params = {
  Name: "DEMO_EVENT", //name of the rule
  ScheduleExpression: "cron(*your cron expression here*)",
  State: "ENABLED"
};

cwevents.putRule(params, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data.RuleArn);
  }
});
```

Above code creates the Rule and returns "RuleARN" but we need to give permission to this rule to trigger the target Lambda Function. Otherwise Lambda Function will not accept triggers from this rule. Let's use the "RuleARN" returned by the putRule method and use it to add permission by calling addPermission method provided by Lambda.

```javascript
cwevents.putRule(params, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data.RuleArn);
    var lambdaParams = {
      Action: "lambda:InvokeFunction",
      FunctionName: "myLambdaFunction",
      Principal: "events.amazonaws.com",
      SourceArn: data.RuleArn,
      StatementId: "ID-1"
    };
    lambda.addPermission(lambdaParams, function(err, data) {
      if (err) console.log(err, err.stack);
      // an error occurred
      else console.log(data);
      // successful response
    });
  }
})
```

Now that we have the Rule created along with the required permissions, let's add Lambda Function as the target & also configure input data to be passed to Lambda when triggered:

```javascript
var targetParams = {
  Rule: "DEMO_EVENT", //name of the CloudWatch rule
  Targets: [
    {
      Arn: "ARN of Lambda Function",
      Id: "myCloudWatchEventsTarget",
      //JSON params to be passed to Lambda when triggered
      Input: '{ "id": "some-id" }'
    }
  ]
};

cwevents.putTargets(targetParams, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data);
  }
});
```

And we are done!

### Resources:
- AWS Docs on Cron Expression:
    https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html#CronExpressions
- CloudWatch Javacript Examples:
    https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/cloudwatch-examples-sending-events.html
- Cron expression generator:
    https://www.freeformatter.com/cron-expression-generator-quartz.html