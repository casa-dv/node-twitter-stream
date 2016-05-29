require('dotenv').config();
var Twitter = require('twitter');
var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");

// Load environment variables
var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET,
});
var port = process.env.PORT || 5000;

// Express REST app
var app = express();
app.use(express.static("static"));
app.get('/test', function(req, res, next) {
	res.send("test");
});
var server = http.createServer(app);

// Websockets broadcast
var wss = new WebSocketServer({server: server});
wss.broadcast = function broadcast(data) {
	wss.clients.forEach(function each(client) {
		client.send(data);
	});
};

// Twitter stream
var stream = client.stream(
	'statuses/filter',
	{
		locations: "-0.489,51.28,0.236,51.686"
	}
);
stream.on('data', function(data) {
	console.log(data.geo);
	if(data.geo){
		var tweet = parse_tweet(data);
		wss.broadcast(JSON.stringify(tweet));
	}
});
stream.on('error', function(error) {
	throw error;
});
function parse_tweet(data){
	var tweet = {
		"id":data.id_str,
		"text":data.text,
		"location":data.geo
	};
	if (data.user) {
		tweet.name = data.user.screen_name;
	}
	return tweet;
}

server.listen(port);
console.info("Listening on port "+port);
