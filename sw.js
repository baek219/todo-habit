// 인터넷이 없어도 앱이 열리도록 파일을 폰에 저장해두는 역할
// 화면 파일은 '인터넷 먼저 → 안 되면 저장본' 방식이라, 새 버전을 올리면 다음에 열 때 바로 반영돼요.
const CACHE_NAME = 'todo-habit-v3.30';
const FILES_TO_CACHE = ['./', './index.html', './desk.html', './login.html', './firebase.js', './sync.js', './lunar.js', './repeat.js', './quick.js', './shell.js', './life.js', './life.css', './life-config.js', './home.html', './money.html', './pet.html', './menu.html', './food.html', './shop.html', './family.html', './calc.html', './weather.html', './gift.html', './fridge.html', './chores.html', './dday.html', './contact.html', './things.html', './workout.html', './settings.html', './hospital.html', './tour.html', './nearby.js', './locmap.js', './notify.js', './cardsms.js', './import.js', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== 'life-notify').map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // 구글 로그인·클라우드 연결은 건드리지 않음
  const isPage = e.request.mode === 'navigate' || /\.(html|js|css)$/.test(url.pathname);
  if (isPage) {
    e.respondWith(
      fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then((res) => { const copy = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(e.request, copy)); return res; })
        .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
});

// ---- 알림 (생활노트 '챙길 것') ----
// 페이지가 만들어 둔 일정(Cache 'life-notify')을 보고, 오늘 것이 있으면 하루 한 번 알림을 띄워요.
async function lifeRemind() {
  const c = await caches.open('life-notify');
  const r = await c.match('./__notify.json'); if (!r) return;
  const data = await r.json(); if (!data || !data.items || !data.items.length) return;
  const d = new Date(), pad = n => (n < 10 ? '0' : '') + n;
  const t = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  if (d.getHours() < (data.hour || 8)) return;
  const s = await c.match('./__notified.json'); const sent = s ? await s.json() : null;
  if (sent && sent.date === t) return;
  const todays = data.items.filter(e => e.date === t); if (!todays.length) return;
  await self.registration.showNotification('오늘 챙길 것 ' + todays.length + '개', {
    body: todays.slice(0, 5).map(e => '· ' + e.text).join('\n') + (todays.length > 5 ? '\n외 ' + (todays.length - 5) + '개' : ''),
    icon: 'icon-192.png', badge: 'icon-192.png', tag: 'life-today', data: { url: 'home.html' }
  });
  await c.put('./__notified.json', new Response(JSON.stringify({ date: t }), { headers: { 'Content-Type': 'application/json' } }));
}
self.addEventListener('periodicsync', (e) => { if (e.tag === 'life-remind') e.waitUntil(lifeRemind()); });
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || 'home.html';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const w = list.find(c => c.url.includes('/todo-habit/'));
    return w ? w.focus().then(() => w.navigate ? w.navigate(url) : null).catch(() => clients.openWindow(url)) : clients.openWindow(url);
  }));
});
