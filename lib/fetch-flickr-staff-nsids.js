var request = require('request'),
	cheerio = require('cheerio'),
	Promise = require('bluebird');

module.exports = function() {

	return new Promise(function (resolve, reject) {

		request('https://www.flickr.com/about/', function(error, response, body) {

			if (error) {
				reject(error);
			}

			if (response.statusCode !== 200) {
				reject('HTTP returned non-200 status code ' + response.statusCode);
			}

			if (!body) {
				reject('Response body is empty');
			}

			var nsids = [];

			$ = cheerio.load(body);
			$('table tr td img').each(function(index, node) {

				var src,
					match,
					nsid;

				src = $(node).attr('src');
				matches = src.match(/#([0-9]+@N[0-9]+)$/);

				if (matches) {

					nsid = matches[1];
					nsids.push(nsid);

				}

			});

			if (nsids.length === 0) {
				reject(new Error('No NSIDs found in HTML. Maybe markup has changed?'));
			}

			resolve(nsids);

		});

	});

}