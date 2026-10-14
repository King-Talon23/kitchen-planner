// Offline support: serve the app's files from a cache, refreshing the cache
// from the network whenever it is reachable (stale-while-revalidate).
// Bump CACHE when the file list changes.

const CACHE = 'kitchen-planner-v2';
const FILES = [
  './', 'index.html', 'styles.css', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png',
  'src/app.js', 'src/store.js', 'src/units.js', 'src/inventory.js', 'src/suggest.js', 'src/shopping.js',
  'src/ui.js', 'src/views-more.js', 'src/spending.js', 'src/sync.js', 'src/barcode.js', 'src/nutrition.js',
  'src/data/prices.js', 'src/data/recipes.js', 'src/data/nutrients.js',
  'vendor/barcode-detector/ponyfill.js', 'vendor/barcode-detector/zxing-exported.js', 'vendor/barcode-detector/zxing_reader.wasm',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request, { ignoreSearch: true });
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
