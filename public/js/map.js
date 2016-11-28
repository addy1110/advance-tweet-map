/**
 * Created by ADDY on 27/11/16.
 */



    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 5,
        center: new google.maps.LatLng(40.7128, -74.0059),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        minZoom: 1
    });

    (function ($, google) {


        var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
        var beachMarker = new google.maps.Marker({
            position: {lat: 40.7128, lng: -74.0059},
            map: map,
            icon: image
        });
        $('.btn-group').colorDrop({
            onChange: function () {
                changeMapStyles(map);
            }
        });
        $('#map').height($(window).height());
        function changeMapStyles(map) {
            var hueColor = '#e67e22',
                roadColor = '#d35400',
                waterColor = '#2980b9',
                parkColor = '#16a085',
                landscapeColor = '#bdc3c7';
            var featureOpts = [
                {
                    stylers: [
                        {hue: hueColor}
                    ]
                }, {
                    elementType: "labels",
                    stylers: [{
                        visibility: "on"
                    }]
                }, {
                    featureType: "road",
                    stylers: [{
                        visibility: "on"
                    }, {
                        color: roadColor
                    }]
                }, {
                    featureType: "water",
                    stylers: [{
                        visibility: "on"
                    }, {
                        color: waterColor
                    }]
                },
                {
                    featureType: "poi"
                    , stylers: [{
                    visibility: "on"
                }, {
                    color: parkColor
                }]
                },
                {
                    featureType: "landscape",
                    stylers: [{
                        visibility: "on"
                    }, {
                        color: landscapeColor
                    }]
                }
            ];
            map.setOptions({
                styles: featureOpts
            });
        }

        changeMapStyles(map);
    })(jQuery, google);
    var markers = [];
    var hashTag = '';

    function myFunction(value) {
        setMapOnAll(null);
        document.getElementById("count").innerHTML = "Loading...";
        hashTag = value;
        $.ajax({
            dataType: "text",
            url: 'http://ec2-52-87-227-167.compute-1.amazonaws.com:8080/' + value,
            success: function (data) {
                data = JSON.parse(data);
                //alert(data[0]._source.location.coordinates);
                console.log(data.length);
                var infowindow = new google.maps.InfoWindow();
                var contentString = '';
                document.getElementById("count").innerHTML = data.length;

                for (i = 0; i < data.length; i++) {
                    try {
                        //console.log(data[i]._source.location.coordinates);
                        var latLng = new google.maps.LatLng(data[i]._source.location.coordinates[0], data[i]._source.location.coordinates[1]);

                        contentString = "<b>Username:</b>" + data[i]._source.username + "<br><b>Tweet: </b>" + data[i]._source.text + "<br><b>Sentiment Score: </b>" + (data[i]._source.sentiment.score * 100).toFixed(2) + "% <i>" + data[i]._source.sentiment.type + "</i>";

                        // Creating a marker and putting it on the map
                        var marker = new google.maps.Marker({
                            position: latLng,
                            map: map,
                            clickable: true,
                            content: contentString,
                            title: "Location: " + JSON.stringify(data[i]._source.location.coordinates)
                        });
                        google.maps.event.addListener(marker, 'click', (function (marker, i) {
                            return function () {
                                infowindow.setContent(marker.content);
                                infowindow.open(map, marker);
                            }
                        })(marker, i));

                        //marker.setAnimation(google.maps.Animation.DROP);
                        markers.push(marker);

                        if (data[i]._source.sentiment.type == "positive") {
                            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png')
                        }
                        else if (data[i]._source.sentiment.type == "neutral") {
                            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png')
                        }
                        else if (data[i]._source.sentiment.type == "negative") {
                            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png')
                        }
                    }
                    catch (e) {
                        console.log("Syntax Error: " + e);
                    }
                }

                x
            }
        });

//        showTweets();
        /*FB.getLoginStatus(function(response) {
         if (response.status === 'connected') {// logged in
         refreshIntervalId = setInterval(showTweets,1000);
         console.log('You are now logged in to Facebook.');
         } else {
         alert('Please Login to see LIVE tweets');
         }
         });*/
    }
    function setMapOnAll(map) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(map);
        }
    }

    /*var showTweets = function() { //trying to fetch tweets from sqs.
     var recParams = {
     QueueUrl: 'https://sqs.us-east-1.amazonaws.com/829344914533/tweet-map-processor', /!* required *!/
     MaxNumberOfMessages: 1,
     AttributeNames: [
     "All"
     ],
     /!* more items *!/
     VisibilityTimeout: 60,
     WaitTimeSeconds: 20
     };

     AWS.config.region = 'us-east-1';
     var creds = new AWS.Credentials({
     accessKeyId: "AKIAJTH7KJBQSHTCILBA", secretAccessKey: "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"
     });
     var sqs = new AWS.SQS({credentials: creds});
     sqs.receiveMessage(recParams, function(err, data) {
     if (err) console.log(err, err.stack); // an error occurred
     else    {
     try{
     //console.log("Received "+JSON.stringify(data));
     fetchedText = JSON.parse(data.Messages[0].Body);
     fetchedText = JSON.parse(JSON.parse(fetchedText.Message).http);
     var tweet = String(fetchedText.text);
     console.log("Fetched: "+fetchedText.text);
     console.log(tweet.indexOf(hashTag) > -1);
     var latLng = new google.maps.LatLng(fetchedText.location.coordinates[0],fetchedText.location.coordinates[1]);

     // Creating a marker and putting it on the map
     if(tweet.indexOf(hashTag) > -1 )
     {
     contentString = "<b>Username:</b> "+fetchedText.username+"<br><b>Tweet: </b>"+fetchedText.text+"<br><b>Sentiment Score: </b>"+(fetchedText.sentiment.score*100).toFixed(2)+"% <i>"+fetchedText.sentiment.type+"</i>";
     var infowindow = new google.maps.InfoWindow({
     content: contentString
     });
     var marker = new google.maps.Marker({
     position: latLng,
     map: map,
     clickable: true,
     content: contentString,
     title: "Location: "+fetchedText.location.coordinates
     });
     google.maps.event.addListener(marker, 'click', (function (marker) {
     return function () {
     infowindow.setContent(marker.content);
     infowindow.open(map, marker);
     }
     })(marker));
     if(fetchedText.sentiment.type == "positive") {
     marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png')
     }
     else if(fetchedText.sentiment.type == "neutral") {
     marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png')
     }
     else if(fetchedText.sentiment.type == "negative") {
     marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png')
     }
     markers.push(marker);
     marker.setAnimation(google.maps.Animation.DROP);
     marker.setMap(map);
     var count = document.getElementById("count").innerHTML;

     var count = +count + +1;
     document.getElementById("count").innerHTML =count;
     }

     }
     catch(e){
     console.log(e);
     }
     }
     });

     }*/
