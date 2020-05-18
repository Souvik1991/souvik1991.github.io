(() => {
    var localKey = 'mdata',
    currentServiceWorker = undefined,
    // Custom bind event, for different browsers
    bindEvent = (el, event, fn) => {
		el.addEventListener ? el.addEventListener(event, fn, false) : el.attachEvent && el.attachEvent('on' + event, fn);
    },
    // This function get stored unsynced data from localstorage
    // Then pass them to service worker to sync
    syncData = () => {
        var mdata = localStorage.getItem(localKey); // Fetching all unsynced data
        if(mdata && currentServiceWorker){
            mdata = JSON.parse(mdata); // Parsing the json
            // Checking if there any pixel links to sync
            if(Array.isArray(mdata) && mdata.length > 0){
                currentServiceWorker.postMessage({
                    cmd: 'SYNC', 
                    data: mdata
                });
                // After passing the data, immediately deleting the data from localstorage
                localStorage.removeItem(localKey);
            }
        }
    };

    // Checking the service worker is supported in the browser or not
    if('serviceWorker' in navigator) {
        // Binding load event on window
        // After the window is loaded we will registering the worker
        bindEvent(window, 'load', () => {
            // Registering the worker
            // Defining the scope of the worker
            navigator.serviceWorker.register(
                '/media-net/service-worker.js', 
                { scope: '/media-net/' }
            )
            .then((reg) => {
                // After registering the working
                // Checking the state of the worker
                var serviceWorker;
                if(reg.installing) {
                    serviceWorker = reg.installing;
                    console.log('Log: Service worker installing');
                } else if(reg.waiting) {
                    serviceWorker = reg.waiting;
                    console.log('Log: Service worker installed');
                } else if(reg.active) {
                    console.log('Log: Service worker active');
                    serviceWorker = reg.active;
                }

                // Checking the worker is already on activated state or not
                // If yes, then assign the worker to "currentServiceWorker" variable
                // So that we can use if to pass data
                if(serviceWorker.state === 'activated'){ 
                    currentServiceWorker = serviceWorker;
                    syncData();
                }
                else{
                    // If the state is not in 'activated'
                    // Binding the event to state change
                    serviceWorker.addEventListener('statechange', (e) => {
                        console.log('Log: Service worker state changed to', e.target.state);
                        // Checking the current state is activated or not
                        if(e.target.state === 'activated'){
                            currentServiceWorker = reg.active;
                            syncData();
                        }
                    });
                }
            }, () => {
                // Something went wrong, not able to register the service worker
                console.log('Log: service worker registration failure.');
            });

            // Binding the error events, if there any error happens on worker
            // this will log the error
            navigator.serviceWorker.onerror = (errorevent) => {
                console.log('Log: Something went wrong', errorevent);
            };

            // Binding the message event
            // When worker post a message, we will be able to receive it here
            navigator.serviceWorker.onmessage = (msg) => {
                if(msg && msg.data && msg.data.cmd){
                    // Storing the unsynced events in localstorage
                    // So that we can sync them later on
                    if(msg.data.cmd === 'STORE') localStorage.setItem(localKey, JSON.stringify(msg.data.data));
                }
            };
        });

        // Binding the beforeunload event with the window
        // Before the tab close it will check if there any remaining pixel events in the queue
        // and the worker will return them to store them in local storage
        bindEvent(window, 'beforeunload', () => {
            if(currentServiceWorker) currentServiceWorker.postMessage({'cmd':'UNLOAD'});
        });

        // This functions will trigger pixel code 
        var adBlock = document.querySelectorAll('.ad-block');
        adBlock.forEach((block) => {
            bindEvent(block, 'click', () => {
                function reqListener(){
                    console.log(this.responseText);
                };
        
                var first = new XMLHttpRequest();
                first.addEventListener("load", reqListener);
                first.open("GET", `${window.location.protocol}//${window.location.host}/media-net/image/pixel.gif?interaction=UserClick&client=ad_media&os_name=macos&x1=google&x2=email&x3=pdfconvert&landing_url=abcd1`);
                first.send();
            })
        });
    }
    else console.log('Log: Service worker not supported.')
})();