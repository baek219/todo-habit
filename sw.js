// 인터넷이 없어도 앱이 열리도록 파일을 폰에 저장해두는 역할
// 화면 파일은 '인터넷 먼저 → 안 되면 저장본' 방식이라, 새 버전을 올리면 다음에 열 때 바로 반영돼요.
const CACHE_NAME = 'todo-habit-v3.20';
const FILES_TO_CACHE = ['./', './index.html', './desk.html', './login.html', './firebase.js', './sync.js', './lunar.js', './repeat.js', './quick.js', './shell.js', './life.js', './life.css', './life-config.js', './home.html', './money.html', './pet.html', './menu.html', './food.html', './shop.html', './family.html', './calc.html', './weather.html', './gift.html', './fridge.html', './chores.html', './dday.html', './contact.html', './things.html', './workout.html', './import.js', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
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
