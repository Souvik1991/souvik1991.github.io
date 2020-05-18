var version = 'v1',
_this = self,
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
				'/media-net/image/pixel.gif'
			])
        })
        .then(function() {
            console.log('WORKER: install completed');
        })
    );
});

self.addEventListener('fetch', (event) => {
	// Checking the request method is GET or not
	// If not get request return
	if(event.request.method !== 'GET') return;
	console.log('WORKER: fetch event in progress.');

	// Parsing the request url
	var url = new URL(event.request.url);
	event.respondWith(async function() {
		// Opening the cache
		// Await can be used inside async function so using it openly
		let cache = await caches.open(`${version}:pixel`);
			cachedResponse = undefined;
		
		// Looping through the cache key
		// Checking the url is matching or not
		cache.keys()
		.then(d => {
			d.forEach(l => { 
				// Checking the url match with pixel.gif
				// And thec checking the l is an instance of Request method
				if(l instanceof Request && /pixel.gif$/.test(l.url)) cachedResponse = l;
			});
		});
		
		// Checking if there url pathname contain pixel.gif or not
		if(/pixel.gif$/.test(url.pathname)) {
			console.log(cachedResponse);
			// Fix the URL and make network call to server to store ad impression
			fetch(fixUrl(url))
			.then((res) => {
				console.log('debug', res);
				// _this.postMessage({"CMD": "fetched", "url": res.url});
			})
			.catch(() => {
				// _this.postMessage({"CMD": "failed", "url": event.request.url});
			});

			if(cachedResponse) return cachedResponse;
			else{
				// If the cache is not present create it
				return fetch('/media-net/image/pixel.gif')
				.then((res) => {
					// we need to save clone to put one copy in cache
					cache.put(event.request, res.clone());
					// Returning the response after fetching
					return res;
				});
			}
		}
		// Fetching the response over network and returning it
		else return fetch(event.request);
	}());
})