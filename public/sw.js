/* Increment VERSION and CSS/JS query versions together for every update. */
'use strict';
const VERSION = '3.0.0';
const CACHE = 'wild-explorer-' + VERSION;
const CORE = ['./', './index.html', './styles.css?v=3.0.0', './app.js?v=3.0.0', './engine.js?v=3.0.0', './postcards.js?v=3.0.0',
  './manifest.webmanifest', './assets/icon.svg', './assets/icon-180.png',
  './assets/icon-192.png', './assets/icon-512.png', './assets/forest-friends-v2.webp'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    // On subsequent releases wait for the user's Update game button.
    if (!self.registration.active) await self.skipWaiting();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CHECK_OFFLINE') event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const present = await Promise.all(CORE.map(url => cache.match(url)));
    event.ports[0]?.postMessage({ready:present.every(Boolean),version:VERSION,files:present.filter(Boolean).length});
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('wild-explorer-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const installed = await cache.match('./index.html');
      if (installed) return installed;
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put('./index.html', response.clone());
        return response;
      } catch {
        return await cache.match('./index.html') || new Response('Open Wild Explorer once with internet before using it offline.', {status:503, headers:{'Content-Type':'text/plain; charset=utf-8'}});
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
    return response;
  })());
});
