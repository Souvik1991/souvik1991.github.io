var version = 'v1',
fixUrl = (purl) => {
	var // purl = new URL(url),
		queries = purl.search.replace(/^\?/, '').split('&'),
		queryArr = [],
		switchObject = {
			interaction: "event",
			client: "customer",
			os_name: "operating_system_name", 
			x1: "utm_source",
			x2: "utm_medium",
			x3: "utm_campaign",
			landing_url: "campaign_url"
		},
		split;

	queries.forEach((el) => {
		split = el.split('=');

		if(switchObject[split[0]] !== undefined) queryArr.push(`${switchObject[split[0]]}=${split[1]}`);
		else queryArr.push(`${split[0]}=${split[1]}`);
	});

	return `${purl.protocol}//${purl.host}${purl.pathname}?${queryArr.join('&')}${purl.hash}`;
};

self.addEventListener('install', (event) => {
    console.log('WORKER: install event in progress.');
    event.waitUntil(
        caches
        .open(`${version}:pixel`)
        .then((cache) => {
            return cache.addAll([
				'/media-net/image/test1.png',
				'/media-net/image/pixel.gif'
			])
        })
        .then(function() {
            console.log('WORKER: install completed');
        })
    );
});

self.addEventListener('activate', (event) => {
    const currentCaches = [`${version}:pixel`];
    event.waitUntil(
		caches.keys().then(cacheNames => {
			return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
		}).then(cachesToDelete => {
			return Promise.all(cachesToDelete.map(cacheToDelete => {
				return caches.delete(cacheToDelete);
			}));
		}).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
	console.log('WORKER: fetch event in progress.');
	// event.respondWith(
	// 	caches.match(event.request)
	// 	.then(function(response) {
	// 		var url = new URL(event.request.url);
	// 		console.log(url);
	// 		if(/pixel.gif$/.test(url.pathname)) {
	// 			return fetch(parseUrl(url))
	// 			.then((response) => {
	// 				return response;
	// 			})
	// 		}
	// 	})
	// );
	event.respondWith(async function(){
		var url = new URL(event.request.url);
		console.log(url);
		console.log(/pixel.gif$/.test(url.pathname));
		if(/pixel.gif$/.test(url.pathname)) {
			// if(navigator.onLine === false){
			// 	caches.open(`${version}:pixel`)
			// 	.then(cache =>
			// 		caches.match(event.request).then((result) => {

			// 			return result;
			// 		})
			// 	)
			// }

			return fetch(parseUrl(url))
			.then((response) => {
				return response;
			})
			.catch((err) => {
				console.log(err);
			})
		}
		else return fetch(event.request);
	}());
})