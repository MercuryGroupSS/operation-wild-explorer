/* Increment VERSION and CSS/JS query versions together for every update. */
'use strict';
const VERSION = '3.0.2';
const CACHE = 'wild-explorer-' + VERSION;
const CORE = ['./', './index.html', './styles.css?v=3.0.2', './app.js?v=3.0.2', './engine.js?v=3.0.2', './postcards.js?v=3.0.2', './classic.js?v=3.0.2',
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
  if (['CHECK_OFFLINE','PREPARE_OFFLINE'].includes(event.data?.type)) event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let present = await Promise.all(CORE.map(url => cache.match(url)));
    let error = '';
    if (event.data.type === 'PREPARE_OFFLINE' && !present.every(Boolean)) {
      try {
        // Do not mix an old installed shell with files from a newer release.
        const source = await fetch('./sw.js', {cache:'no-store'});
        const remoteVersion = (await source.text()).match(/const VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1];
        if (!source.ok || remoteVersion !== VERSION) throw new Error('A different game release is available. Check for an update before downloading again.');
        await cache.addAll(CORE.filter((url,index) => !present[index]));
        present = await Promise.all(CORE.map(url => cache.match(url)));
      } catch (problem) { error = problem.message || 'Could not download all offline files. Try again online.'; }
    }
    event.ports[0]?.postMessage({ready:present.every(Boolean),version:VERSION,files:present.filter(Boolean).length,error});
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
