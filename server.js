/**
 * Created by ADDY on 23/11/16.
 */
var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));


require("./Subscribe.js");

var port = 8081;
var server = app.listen(port, function(){
    console.log("server running at localhost:"+port+"/");

});
