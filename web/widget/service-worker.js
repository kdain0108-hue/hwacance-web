const CACHE_NAME = "hwacance-widget-v1";
const ASSET_URLS = [
  "./index.html",
  "./manifest.json",
  "../assets/css/app.css",
  "../assets/js/stopwatch.js",
  "../assets/js/app-main.js",
  "../assets/img/logo.png",
  "../assets/img/toilet.png",
  "../assets/fonts/Mona12.woff2",
  "../assets/audio/growl-piano.mp4"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSET_URLS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
