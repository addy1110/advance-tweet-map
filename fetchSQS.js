/**
 * Created by ADDY on 24/11/16.
 */
var http = require("http");
var AWS = require('aws-sdk');
var options = require('./config.js'); // very important to keep the keys safe and secure.
AWS.config.update({region:'us-east-1'});
var AWSaccessKey = options.storageConfig.aws_access_key_id;
var secretAccessKey = options.storageConfig.aws_secret_access_key;
var topicArn = "arn:aws:sns:us-east-1:829344914533:processed-tweets";
var creds = new AWS.Credentials({
    accessKeyId: AWSaccessKey, secretAccessKey: secretAccessKey
});

var sqs = new AWS.SQS({apiVersion: '2012-11-05', credentials : creds});

var sns = new AWS.SNS({apiVersion: '2010-03-31',credentials : creds});

var watson = require('watson-developer-cloud');

var alchemy_language = watson.alchemy_language({
    api_key: options.storageConfig.alchemyKey
});

var recParams = {
    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/829344914533/tweet-map-processor', /* required */
    MaxNumberOfMessages: 1,
    AttributeNames: [
        "All"
    ],
    /* more items */
    VisibilityTimeout: 43200,
    WaitTimeSeconds: 20
};


(function loop() {
    console.log("trying to fetch tweets from SQS queue...\n");
    sqs.receiveMessage(recParams, function(err, data) {
        if (err) {
            console.log(err);
        }// an error occurred
        else {
            var fetchedText = JSON.parse(data.Messages[0].Body);
            console.log("Fetched: ",JSON.parse(data.Messages[0].Body));
            process.nextTick(loop);

            var alchemyParams = {
                text: fetchedText.text,
                outputMode: 'json',
                showSourceText: 1   };

            console.log("Doing Sentimental Analysis now...\n");
            alchemy_language.sentiment(alchemyParams, function (err, response) {
                if (err) {
                    console.log("Alchemy Error Occured...Moving on to next tweet\n"+JSON.stringify(err)); // an error occurred

                }
                else {
                    var sentiment = JSON.parse(JSON.stringify(response)).docSentiment;
                    // console.log(sentiment);
                    var httpMessage = {
                        "username": fetchedText.username,
                        "text": fetchedText.text,
                        "location": JSON.stringify(fetchedText.location.coordinates),
                        "sentiment": JSON.stringify(sentiment.type)
                    };
                    console.log(httpMessage);
                    var message = {
                        "default":"Message from Aditya",
                        "http": httpMessage
                    };
                    var SNSParams = {
                        Message: JSON.stringify(message),
                        MessageStructure: 'json',
                        TopicArn: topicArn

                    };
                    sns.publish(SNSParams, function(err, data) {
                        if (err) console.log(err, err.stack); // an error occurred
                        else     {
                            console.log(data);           // successful response
                            console.log("SNS Params: "+SNSParams.Message);
                            process.nextTick(loop);
                        }

                    });

                }

            });
        }
    });

}());