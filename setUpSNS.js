/**
 * Created by ADDY on 27/11/16.
 */
var http = require("http");
var elasticsearch = require('elasticsearch');
var fs = require("fs");
var requestVar = require("request");

var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
var AWSaccessKey = "";
var secretAccessKey = "";
var creds = new AWS.Credentials({
    accessKeyId: AWSaccessKey, secretAccessKey: secretAccessKey
});

var sns = new AWS.SNS({apiVersion: '2010-03-31',credentials : creds});

http.createServer(function(request, response){

    if(request.method == 'POST') {
        console.log("Got a POST request");
        var msgBody = '';
        request.on( 'data', function( data ){
            msgBody += data;
        });
        request.on( 'end', function(){
            var msgData = JSON.parse( msgBody );
            var msgType = request.headers[ 'x-amz-sns-message-type' ];
            handleIncomingMessage( msgType, msgData );
        });

        // SNS doesn't care about our response as long as it comes
        // with a HTTP statuscode of 200
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('OK');
    }

    else if (request.method == 'GET') {
        response.writeHead(200, {"Content-Type": "text",'Access-Control-Allow-Origin': '*'});
        var client = new elasticsearch.Client({
            host: 'http://search-sentiment-tweets-zwd7yfbgyq5kkp27u5cgiptzfa.us-east-1.es.amazonaws.com/domain/sentiment-tweet'
        });
        hits = '';
        type = request.url.substring(1);

        var domains = [
            /*
             * 0 : Election
             * 1 : Sports
             * 2 : Entertainment
             * 3 : Health
             * 4 : Technology
             * 5 : Travel
             * 6 : Religion
             * 7 : Food
             * 8 : Fashion
             * 9 : Social Media
             */
            "election,trump,hillary,vote,clinton,democrats,republicans,debate,voting,elections",
            "games,sports,fifa,espn,racing,race,cricket,soccer,football,nba,baseball,sports,basketball,golf,swimming",
            "entertainment,music,movie,song,songs,broadway,hollywood,bollywood,selfie",
            "health,gym,exercise,fitness,yoga,healthy,fit,nutrition,wellness,ill",
            "technology,apple,mac,gadget,samsung,iphone,sony,mobile,science,engineering,tech,robotics",
            "travel,travelling,journey,trip,roadtrip,tour,driving,flying,transit,trekking,riding,bikig,cruising,weekend",
            "religion,faith,god,jesus,spirituality,church,humanity,peace,worship,prayer,ritual",
            "food,restraunt,lunch,dinner,breakfast,foodie,pizza,dining,tasty,eat,eating,recipes,wine,bar",
            "fashion,style,models,magazine,playboy,clothes,dress,trend,gucci,halloween,brand",
            "facebook,snapchat,youtube,social,media"
        ];

        if(type == "All"){type =domains[0]+domains[1]+domains[2]+domains[3]+domains[4]+domains[5]+domains[6]+domains[7]+domains[8]+domains[9];}
        else if(type == "Religion"){type = domains[6];}
        else if(type == "Entertainment"){type = domains[2];}
        else if(type == "Technology"){type = domains[4];}
        else if(type == "Sports"){type = domains[1];}
        else if(type == "Election"){type = domains[0];}
        else if(type == "Food"){type = domains[7];}
        else if(type == "Social"){type = domains[9];}
        else if(type == "Fashion"){type = domains[8];}
        else if(type == "Travel"){type = domains[5];}
        else if(type == "Health"){type = domains[3];}
        console.log("the url caught is : "+type);
        client.search({
            q: type,
            size: 10000
        }).then(function (body) {
            var hits = body.hits.hits;
            console.log(request.url);
            console.log("hits: "+(JSON.stringify(hits.length)));
            response.write(JSON.stringify(hits,null,3));
//for( i =0; i < hits.length; i++)
//  console.log(i+": "+(hits[i]._source.location.coordinates)+"|| Sentiment: "+ (hits[i]._source.sentiment.type));

            response.end();
        }, function (error) {
            console.trace(error.message);
        });
    }
    //concatenate POST data
    else
        response.end();

}).listen(8080);

console.log("Listening...");

function handleIncomingMessage( msgType, msgData ) {
    if( msgType === 'SubscriptionConfirmation') {
        //confirm the subscription.
        console.log("got SnS Confirm message");
        console.log(msgData.Token);
        snsParams = {
            Token: msgData.Token,
            TopicArn: msgData.TopicArn
        };
        sns.confirmSubscription(snsParams, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
        });
    } else if ( msgType === 'Notification' ) {
        // That's where the actual messages will arrive
        try{dataMessage = JSON.parse(msgData.Message);
            postToES(dataMessage);
        }catch(e){}
    } else {
        console.log( 'Unexpected message type ' + msgType );
    }
}

function postToES(dataMessage){
    console.log(dataMessage);
    try
    {
        requestVar({
            uri: 'http://search-sentiment-tweets-zwd7yfbgyq5kkp27u5cgiptzfa.us-east-1.es.amazonaws.com/domain/sentiment-tweet',
            method: "POST",
            json: dataMessage
        }).on('response', function(response) {
            console.log("Row "+response.statusMessage+" with location: "+JSON.stringify(dataMessage.location));
        });
    }
    catch(e) {
        console.log (e);
    }
}

