var fs = require("fs"),
    request = require("request"),
    options = require('./config.js'),
    Twit = require('twit');
var AWS = require('aws-sdk');

AWS.config.update({region: 'us-east-1'});
var AWSaccessKey = options.storageConfig.aws_access_key_id;
var secretAccessKey = options.storageConfig.aws_secret_access_key;

var creds = new AWS.Credentials({
    accessKeyId: AWSaccessKey, secretAccessKey: secretAccessKey
});

var sqs = new AWS.SQS({apiVersion: '2012-11-05', credentials : creds});


var fetch;
fetch = new Twit({
    consumer_key: options.storageConfig.consumer_key,
    consumer_secret: options.storageConfig.consumer_secret,
    access_token: options.storageConfig.access_token,
    access_token_secret: options.storageConfig.access_token_secret
});


//Pushing tweets into elastic search.
var hashtags;
hashtags =  'election,trump,hillary,vote,clinton,democrats,republicans,debate,voting,elections' +
    'games,sports,fifa,espn,racing,race,cricket,soccer,football,nba,baseball,sports,basketball,golf,swimming,' +
    'entertainment,music,movie,song,songs,broadway,hollywood,bollywood,selfie,' +
    'health,gym,exercise,fitness,yoga,healthy,fit,nutrition,wellness,ill' +
    'technology,apple,mac,gadget,samsung,iphone,sony,mobile,science,engineering,tech,robotics' +
    'travel,travelling,journey,trip,roadtrip,tour,driving,flying,transit,trekking,riding,bikig,cruising,weekend' +
    'religion,faith,god,jesus,spirituality,church,humanity,peace,worship,prayer,ritual' +
    'food,restraunt,lunch,dinner,breakfast,foodie,pizza,dining,tasty,eat,eating,recipes,wine,bar' +
    'fashion,style,models,magazine,playboy,clothes,dress,trend,gucci,halloween,brand' +
    'facebook,snapchat,youtube,social,media';
var world = [ '-180', '-90', '180', '90' ];
var stream = fetch.stream('statuses/filter', {track: hashtags}, { locations: world});
var count=0;
stream.on('error',function(error){
    throw error
});
stream.on('tweet', function(tweet) {
    if ((tweet.geo !=null) && (tweet.text.lang = "en")){
        count+=1;
        console.log("tweets counted:"+count+" tweet: "+tweet.text);
        var obj = {
            'username': tweet.user.name,
            'text': tweet.text,
            'location': tweet.geo
        };

        console.log(obj);

        var sendParams = {
            MessageBody: JSON.stringify(obj),
            /* required */
            QueueUrl: 'https://sqs.us-east-1.amazonaws.com/829344914533/tweet-map-processor', /* required */
            DelaySeconds: 0,
            MessageAttributes: {}
        };

        sqs.sendMessage(sendParams, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                console.log("Pushed to SQS\n");

            }
        });

    }
});
