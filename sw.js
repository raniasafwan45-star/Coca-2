// Coca-Cola Distributor — Service Worker
var CACHE = 'coca-distrib-v3';
var ASSETS = [
  './',
  './coca_cola_distributor%20(1).html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@500;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js'
];

// Install — cache assets
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      // cache what we can, ignore failures for external resources
      return Promise.allSettled(
        ASSETS.map(function(url){
          return cache.add(url).catch(function(){});
        })
      );
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

// Activate — clean old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){return k!==CACHE;})
          .map(function(k){return caches.delete(k);})
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', function(e){
  // skip non-GET and Firebase requests (always need network)
  if(e.request.method!=='GET') return;
  if(e.request.url.includes('firestore.googleapis.com')) return;
  if(e.request.url.includes('firebase')) return;
  if(e.request.url.includes('maps.googleapis.com')) return;

  e.respondWith(
    fetch(e.request).then(function(response){
      // cache successful responses
      if(response&&response.status===200){
        var clone=response.clone();
        caches.open(CACHE).then(function(cache){
          cache.put(e.request,clone);
        });
      }
      return response;
    }).catch(function(){
      // offline fallback
      return caches.match(e.request).then(function(cached){
        if(cached) return cached;
        // if HTML page not in cache — return main app
        if(e.request.destination==='document'){
          return caches.match('./coca_cola_distributor%20(1).html');
        }
      });
    })
  );
});

// Push notifications
self.addEventListener('push', function(e){
  var data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title||'Coca-Cola Distributor', {
      body: data.body||'',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Coca-Cola_Logo.svg/192px-Coca-Cola_Logo.svg.png',
      badge: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Coca-Cola_Logo.svg/72px-Coca-Cola_Logo.svg.png',
      vibrate: [200, 100, 200],
      dir: 'rtl',
      lang: 'ar'
    })
  );
});
