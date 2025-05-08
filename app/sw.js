self.addEventListener('install', e => {
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  self.clients.claim();
});
// Questo è importante: anche se non fai nulla,
// intercetta le fetch per abilitarti come PWA
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request));
});