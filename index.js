var nsids = require(__dirname + '/data/staff.json'),
	request = require('request'),
	rateLimit = require('function-rate-limit'),
	levelup = require('levelup'),
	db = levelup('./faves');

var fs = require('fs'),
	Flickr = require("flickrapi"),
	config = require('config'),
	flickrOptions = config.get('flickr');

var express = require('express'),
    exphbs  = require('express-handlebars');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
    res.render('home');
});

io.on('connection', function(socket){
	console.log('a user connected');
});

http.listen(6969, function(){
	console.log('listening on *:6969');
});

Flickr.authenticate(flickrOptions, function(err, flickr) {

	var check = function() {

		var timestamp = Math.floor(new Date().getTime() / 1000) - 60;

		console.log('polling...');

		nsids.forEach(function(nsid) {

			flickr.favorites.getPublicList({
				"user_id": nsid,
				"per_page": 10,
				"extras": "safety_level,sizes,url_sq,url_t,url_s,url_q,url_m,url_n,url_z,url_c,url_l,url_h,url_k",
				"min_fave_date": timestamp
			}, function(err, result) {

				var total = parseInt(result.photos.total, 10);
				if (total > 0) {

					var photos = result.photos.photo;

					flickr.people.getInfo({"user_id": nsid, "extras": "buddyicon_url"}, function(err, result) {

						var buddyIconUrl = 'https://farm' + result.person.iconfarm + '.staticflickr.com/' + result.person.iconserver + '/buddyicons/' + nsid + '_r.jpg';

						request({
							url: buddyIconUrl,
							method: 'HEAD',
							followRedirect: false
						}, function(err, response) {

							if (response.statusCode === 302) {
								buddyIconUrl = 'https://farm' + result.person.iconfarm + '.staticflickr.com/' + result.person.iconserver + '/buddyicons/' + nsid + '.jpg';
							}

							console.log(nsid + ' - ' + buddyIconUrl);

							photos.forEach(function(photo) {

								var sizes,
									size,
									safety,
									key;

								safety = parseInt(photo['safety_level'], 10);

								// Censored or not?
								// if (safety > 0) {
								// 	return;
								// }

								key = nsid + '.' + photo.id;

								db.get(key, function(err, value) {

									if (err) {

										console.log('broadcasting ' + key);

										sizes = photo.sizes.split(',');

										do {
											size = sizes.pop();						
										} while (size === 'o');

										var farmUrl = photo['url_' + size];
										console.log(farmUrl);

										io.emit('fave', JSON.stringify({
											'buddyIconUrl': buddyIconUrl,
											'photoFarmUrl': farmUrl,
											'safety': safety
										}));

										db.put(key, true);

									} else {

										console.log('skipping ' + key);

									}

								});

							});


						});


					});

				}

			});

		});		

	};

	check();
	setInterval(check, 60000);

});