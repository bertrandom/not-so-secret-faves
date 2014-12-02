var fetchFlickrStaffNsids = require('./lib/fetch-flickr-staff-nsids'),
	fs = require('fs');

fetchFlickrStaffNsids().then(function(nsids) {
	fs.writeFileSync(__dirname + '/data/staff.json', JSON.stringify(nsids));
});