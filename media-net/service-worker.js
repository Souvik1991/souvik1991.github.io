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
				'/media-net/image/test1.jpg',
				'/media-net/image/pixel.gif'
			])
        })
        .then(function() {
            console.log('WORKER: install completed');
        })
    );
});

// This event listener is not require all the time
// While the 
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
	// Checking the request method is GET or not
	// If not get request return
	if(event.request.method !== 'GET') return;
	console.log('WORKER: fetch event in progress.');

	// Parsing the request url
	var url = new URL(event.request.url);
	event.respondWith(async function() {
		// Opening the cache
		// Await can be used inside async function so using it openly
		let cache = await caches.open(`${version}:pixel`), 
			cachedResponse = await cache.match(event.request);
		
		console.log(cache);
		console.log(cachedResponse);
		// Checking if there url pathname contain pixel.gif or not
		if(/pixel.gif$/.test(url.pathname)) {
			if(cachedResponse){
				fetch(fixUrl(url))
				.then((res) => {
					console.log('debug', res);
					self.postMessage({"CMD": "fetched", "url": res.url});
				})
				.catch(() => {
					self.postMessage({"CMD": "failed", "url": event.request.url});
				});

				event.waitUntil(cache.add(event.request));
				return cachedResponse;
			}
			else{
				return fetch(fixUrl(url))
				.then((res) => {
					console.log(res);
					// response may be used only once
					// we need to save clone to put one copy in cache
					cache.put(event.request, res.clone());

					self.postMessage({"CMD": "fetched", "url": res.url});
					
					// Returning the response after fetching
					return res;
				}).catch(() => {
					self.postMessage({"CMD": "failed", "url": event.request.url});
				});
			}
		}
		// Handler for cached response for test1.jpg
		else if(cachedResponse){
			event.waitUntil(cache.add(event.request));
			return cachedResponse;
		}
		// Fetching the response over network and returning it
		else return fetch(event.request);
	}());
})