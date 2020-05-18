(() => {
    var localKey = 'mdata',
    notSynced = [],
    bindEvent = (el, event, fn) => {
		el.addEventListener ? el.addEventListener(event, fn, false) : el.attachEvent && el.attachEvent('on' + event, fn);
	},
	// unbindEvent = (el, event, fn) => {
	// 	el.removeEventListener ? el.removeEventListener(event, fn) : el.detachEvent && el.detachEvent('on' + event, fn);
    // },
    body = (document.body || document.getElementsByTagName('body')[0]);

    bindEvent(document.getElementById('div'), 'click', () => {
        fetch(`${window.location.protocol}//${window.location.host}/media.net/image/pixel.gif?interaction=UserClick&client=ad_media&os_name=macos&x1=google&x2=email&x3=pdfconvert&landing_url=abcd1`)
        .then(response => response.blob())
        .then(images => {
            // outside = URL.createObjectURL(images);
            console.log(images)
        })

        // function reqListener () {
        //     console.log(this.responseText);
        // }
        
        // var oReq = new XMLHttpRequest();
        // oReq.addEventListener("load", reqListener);
        // oReq.open("GET", `${window.location.protocol}//${window.location.host}/media.net/image/pixel.gif?interaction=UserClick&client=ad_media&os_name=macos&x1=google&x2=email&x3=pdfconvert&landing_url=abcd1`);
        // oReq.send();

        var image = document.createElement('img');
        image.setAttribute('src', `${window.location.protocol}//${window.location.host}/media.net/image/pixel.gif?interaction=UserClick&client=ad_media&os_name=macos&x1=google&x2=email&x3=pdfconvert&landing_url=abcd1`);
        body.appendChild(image);
    });

    if('serviceWorker' in navigator) {
        bindEvent(window, 'load', () => {
            // var worker = new Worker('/js/service-worker.js'),
            //     mdata = localStorage.getItem(localKey); // Fetching all unsynced data

            // worker.addEventListener('message', (e) => {
            //     console.log('Worker said: ', e.data);
            //     notSynced.push(e)
            // }, false);

            // if(mdata){
            //     mdata = JSON.parse(mdata);
            //     worker.postMessage({cmd: 'SYNC', data: mdata});
            //     localStorage.setItem(localKey, JSON.stringify([]));
            // }

            navigator.serviceWorker.register('/media.net/js/service-worker.js')
            .then(() => {
                console.log('Log: service worker registration complete.');
            }, () => {
                console.log('Log: service worker registration failure.');
            });
        });

        // bindEvent(window, 'beforeunload', () => {
        //     if(notSynced.length > 0) localStorage.setItem(localKey, JSON.stringify(notSynced));
        // });
    }
    else console.log('Log: Service worker not supported.')
})();