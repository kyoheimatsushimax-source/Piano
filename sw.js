/* ピアノのたまご — Service Worker
   ★アプリを更新したら、必ず下の CACHE の数字を上げること（v3 → v4）。
   ※github.io は他の自作アプリと同じ場所なので、消すのは piano-egg- で始まる古いキャッシュだけ。
     上げないと、家のiPadは古いままキャッシュから開き続けます。 */
const CACHE = 'piano-egg-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('piano-egg-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* それ以外はキャッシュ優先。裏で取り直して次回に反映（stale-while-revalidate） */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  /* ページ本体はネットワーク優先（更新をすぐ反映）。オフライン時はキャッシュ */
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      }).catch(() => caches.match(e.request).then(h => h || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
