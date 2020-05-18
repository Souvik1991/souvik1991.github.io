let version = 'v1',
_this = self,
QUEUE_OBJECT = {
	queue: [],
	networkCall: false,
	callee(){
		if(!this.networkCall){
			// Check the browser is online or offline
			// If offline wait for 2s before making the call again
			if(navigator.onLine){
				this.networkCall = true;
				let url = this.queue.pop(0),
				// Create a new XMLHttpRequest object
				xhr = new XMLHttpRequest();

				xhr.open('GET', url);
				// Send the request over the network
				xhr.send();
				// This will be called after the response is received
				xhr.onload = () => {
					this.networkCall = false;
					if(xhr.status === 200){
						if(this.queue.length > 0) this.callee();
					}
					else{
						this.queue.unshift(url);
						this.callee();
					}
				};
				// If the network error happen or for some reason not able to make the call
				// Set the variable value so it will get pushed in the queue at the beginning
				xhr.onerror = () => {
					console.log('Log: Something went wrong.');
					this.networkCall = false;
					this.queue.unshift(url);
					this.callee();
				};
			}
			else{
				console.log('Log: Browser is offline.');
				setTimeout(() => {
					console.log('Log: timeout done, calling again.');
					this.callee();
				}, 2000);
			}
		}
	},
	get Queue() {
		return this.queue
	},
	// Setter method of an object
	set Queue(value) {
		if(value) this.queue.push(value);
		this.callee();
	}
},
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

// Installing the service worker
// Caching the pixel file, so that we can serve it immediate for each request
self.addEventListener('install', (event) => {
    console.log('Log: install event in progress.');
    event.waitUntil(
        caches
        .open(`${version}:pixel`)
        .then((cache) => {
            return cache.addAll([
				'/media-net/image/pixel.gif'
			])
        })
        .then(function() {
            console.log('Log: install completed');
        })
    );
});

self.addEventListener('fetch', (event) => {
	// Checking the request method is GET or not
	// If not get request return
	if(event.request.method !== 'GET') return;
	console.log('Log: fetch event in progress.');

	// Parsing the request url
	var url = new URL(event.request.url);
	event.respondWith(async function() {
		// Checking if there url pathname contain pixel.gif or not
		if(/pixel.gif$/.test(url.pathname)) {
			// Opening the cache
			// Await can be used inside async function so using it openly
			let request = new Request('/media-net/image/pixel.gif'),
				cache = await caches.open(`${version}:pixel`);

			let cachedResponse = await cache.match(request);

			console.log(cachedResponse);

			// Fix the URL and Push it to queue 
			// Queue code will make network call to the server to store ad impression
			QUEUE_OBJECT.Queue = fixUrl(url);
			
			if(cachedResponse) return cachedResponse;
			else{
				// If the cache is not present create it
				return fetch(request)
				.then((res) => {
					// we need to save clone to put one copy in cache
					cache.put(request, res.clone());
					// Returning the response after fetching
					return res;
				});
			}
		}
		// Fetching the response over network and returning it
		else return fetch(event.request);
	}());
});

self.addEventListener('message', (event) => {
	event.waitUntil(async function() {
		// Exit early if we don't have access to the client.
    	// Eg, if it's cross-origin.
		if(!event.clientId) return;

		if(event && event.data){
			if(event.data.cmd === 'UNLOAD'){
				var queue = QUEUE_OBJECT.Queue;
				if(queue.length > 0) {
					// Get the client.
					const client = await clients.get(event.clientId);
					// Exit early if we don't get the client.
					// Eg, if it closed.
					if(!client) return;

					// Sending the pending queue to frontend so that it can be saved in localstorage
					// Later on we can use it once the user revisit the site
					client.postMessage({
						cmd: "STORE",
						data: queue
					});
				}
			}
			else if(event.data.cmd === 'SYNC'){
				// Looping throug all the data and pushing it to the queue
				event.data.data.forEach((url) => {
					QUEUE_OBJECT.Queue = fixUrl(url);
				});
			}
		}
	}());
});