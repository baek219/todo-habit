/* 생활노트 공통 기능
 * - 기존 할일습관의 구글 로그인(sync.js)을 그대로 씀
 * - 각 기능(가계부·반려동물·맛집 등)의 기록을 이 기기에 저장하고, 로그인하면 클라우드(Firebase)와 자동으로 맞춤
 *   클라우드 위치: users/{내 아이디}/life/{기능 이름}
 * - 중간 서버(Cloudflare) 호출 도우미
 */
(function () {
  const OWNER_KEY = 'life_owner_v1';
  const stores = {};
  const userSubs = new Set();

  /* ---------- 작은 도우미 ---------- */
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'style') e.setAttribute('style', v);
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, v);
    }
    for (const c of kids.flat(Infinity)) if (c != null && c !== false) e.append(c.nodeType ? c : String(c));
    return e;
  }
  const pad = n => (n < 10 ? '0' : '') + n;
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const today = () => iso(new Date());
  const won = n => (Math.round(Number(n) || 0)).toLocaleString('ko-KR') + '원';
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  function daysBetween(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  function prettyDate(s) {
    if (!s) return '';
    const d = new Date(s + 'T00:00:00');
    const y = d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() + '년 ' : '';
    return y + (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + WD[d.getDay()] + ')';
  }

  let toastTimer;
  function toast(msg) {
    let t = document.getElementById('life-toast');
    if (!t) { t = h('div', { id: 'life-toast', class: 'life-toast', role: 'status' }); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // 아래에서 올라오는 입력 창 (폰) / 가운데 창 (PC)
  function sheet(title, body) {
    const veil = h('div', { class: 'sheet-veil' });
    const box = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'card-head' }, h('h2', {}, title), h('button', { class: 'icon-btn', type: 'button', 'aria-label': '닫기', onclick: () => close() }, '✕')),
      body);
    veil.appendChild(box);
    const close = () => { veil.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    veil.addEventListener('click', e => { if (e.target === veil) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(veil);
    const first = box.querySelector('input,select,textarea'); if (first) setTimeout(() => first.focus(), 30);
    return close;
  }

  /* ---------- 저장소 ---------- */
  function fp(s) { return JSON.stringify(s); }
  function merge(a, b) {
    const by = {};
    [...(a.items || []), ...(b.items || [])].forEach(it => {
      const cur = by[it.id];
      if (!cur || (it.updatedAt || 0) > (cur.updatedAt || 0)) by[it.id] = it;
    });
    const cutoff = Date.now() - 90 * 86400000; // 지운 표시는 90일 뒤 정리
    const items = Object.values(by).filter(it => !(it.deleted && (it.updatedAt || 0) < cutoff))
      .sort((x, y) => (x.createdAt || 0) - (y.createdAt || 0) || String(x.id).localeCompare(String(y.id)));
    const useA = (a.metaAt || 0) >= (b.metaAt || 0);
    return { items, meta: useA ? (a.meta || {}) : (b.meta || {}), metaAt: Math.max(a.metaAt || 0, b.metaAt || 0) };
  }

  // 가족 공유를 켜면 이 기능들의 기록은 groups/{가족 아이디}/life/{이름} 에 같이 저장돼요
  const SHARED = ['money', 'shop', 'pets', 'petlog', 'supplies'];
  const GROUP_CACHE = 'life_group_v1';
  function cachedGroup(uid) { try { const g = JSON.parse(localStorage.getItem(GROUP_CACHE)); return g && g.uid === uid ? g.gid : null; } catch (e) { return null; } }
  function setCachedGroup(uid, gid) { try { localStorage.setItem(GROUP_CACHE, JSON.stringify({ uid, gid: gid || null })); } catch (e) {} }

  function makeStore(name) {
    const shared = SHARED.includes(name);
    const subs = new Set();
    let scope = 'local', LK = keyFor('local'), state = load(), ref = null, unsub = null, pushTimer = null, remoteFp = null;

    function keyFor(sc) { return sc.startsWith('g:') ? 'life_g_' + sc.slice(2) + '_' + name + '_v1' : 'life_' + name + '_v1'; }
    function load(key) {
      try { const v = JSON.parse(localStorage.getItem(key || LK)); if (v && Array.isArray(v.items)) return { items: v.items, meta: v.meta || {}, metaAt: v.metaAt || 0 }; } catch (e) {}
      return { items: [], meta: {}, metaAt: 0 };
    }
    function persist() { try { localStorage.setItem(LK, JSON.stringify(state)); } catch (e) { toast('이 기기에 저장 공간이 부족해요.'); } }
    function notify() { subs.forEach(f => { try { f(api); } catch (e) { console.error(e); } }); }
    function changed() { persist(); notify(); schedulePush(1200); }

    function schedulePush(ms) { if (!ref) return; clearTimeout(pushTimer); pushTimer = setTimeout(push, ms); }
    async function push() {
      if (!ref) return;
      const K = window.CloudSync.K;
      const body = fp(state);
      if (body === remoteFp) return;
      try { await K.setDoc(ref, { v: 1, data: body, updatedAt: Date.now() }); remoteFp = body; }
      catch (e) { toast('클라우드 저장 실패: ' + (e.code === 'permission-denied' ? 'Firebase 규칙을 확인해 주세요' : (e.code || e.message || e))); }
    }

    function attach(uid) {
      const gid = shared && uid ? cachedGroup(uid) : null;
      const sc = !uid ? 'local' : gid ? 'g:' + gid : 'u:' + uid;
      if (sc === scope && ref) return;
      detach();
      const CS = window.CloudSync, K = CS.K;
      const prevKey = LK;
      scope = sc; LK = keyFor(sc);
      state = load();
      if (gid) {
        // 처음 가족 공유로 바뀔 때, 내 기록을 공용 공간에 합쳐 넣음 (기기마다 한 번)
        const flag = 'life_gmerged_' + gid + '_' + name;
        let done = false; try { done = localStorage.getItem(flag) === '1'; } catch (e) {}
        if (!done) {
          const mine = load(keyFor('u:'));
          if (mine.items.length || mine.metaAt) state = merge(state, mine);
          try { localStorage.setItem(flag, '1'); } catch (e) {}
          persist();
        }
      }
      if (prevKey !== LK) notify();
      ref = gid ? K.doc(CS.db, 'groups', gid, 'life', name) : K.doc(CS.db, 'users', uid, 'life', name);
      unsub = K.onSnapshot(ref, snap => {
        if (snap.metadata.hasPendingWrites) return;
        let remote = null;
        if (snap.exists()) { try { remote = JSON.parse(snap.data().data); } catch (e) { remote = null; } }
        remoteFp = remote ? fp(remote) : null;
        const merged = remote ? merge(state, remote) : state;
        const localChanged = fp(merged) !== fp(state);
        state = merged; persist();
        if (localChanged) notify();
        if (!remote || fp(merged) !== remoteFp) schedulePush(300);
      }, err => toast(err.code === 'permission-denied' ? (gid ? '가족 공유 기록을 읽을 수 없어요. Firebase 규칙을 확인해 주세요.' : '동기화 권한이 없어요.') : '동기화 오류: ' + (err.code || err.message || err)));
    }
    function detach() { if (unsub) unsub(); unsub = null; ref = null; clearTimeout(pushTimer); }
    function reset() { state = { items: [], meta: {}, metaAt: 0 }; persist(); notify(); }

    const api = {
      name, shared,
      isShared: () => scope.startsWith('g:'),
      items: () => state.items.filter(i => !i.deleted),
      get: id => state.items.find(i => i.id === id && !i.deleted) || null,
      exists: id => state.items.some(i => i.id === id), // 지운 기록 포함 (자동 입력이 지운 걸 되살리지 않게)
      put(item) {
        const now = Date.now();
        const it = Object.assign({}, item, { id: item.id || newId(), updatedAt: now });
        if (!it.createdAt) it.createdAt = now;
        const CS = window.CloudSync; if (!it.by && CS && CS.user) it.by = CS.user.uid;
        const i = state.items.findIndex(x => x.id === it.id);
        if (i >= 0) state.items[i] = it; else state.items.push(it);
        changed(); return it;
      },
      remove(id) {
        const i = state.items.findIndex(x => x.id === id);
        if (i >= 0) { state.items[i] = { id, deleted: true, updatedAt: Date.now(), createdAt: state.items[i].createdAt }; changed(); }
      },
      meta: () => state.meta,
      setMeta(patch) { state.meta = Object.assign({}, state.meta, patch); state.metaAt = Date.now(); changed(); },
      subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
      _attach: attach, _detach: detach, _reset: reset
    };
    return api;
  }

  function store(name) {
    if (!stores[name]) {
      stores[name] = makeStore(name);
      const CS = window.CloudSync;
      if (CS && CS.user && CS.db) stores[name]._attach(CS.user.uid);
    }
    return stores[name];
  }

  /* ---------- 가족 공유 ---------- */
  const groupSubs = new Set();
  function groupId() { const u = window.CloudSync && window.CloudSync.user; return u ? cachedGroup(u.uid) : null; }
  function applyGroup(gid) {
    const CS = window.CloudSync; if (!CS || !CS.user) return;
    if (cachedGroup(CS.user.uid) === (gid || null)) return;
    setCachedGroup(CS.user.uid, gid);
    Object.values(stores).forEach(s => { if (s.shared) s._attach(CS.user.uid); });
    groupSubs.forEach(f => { try { f(gid); } catch (e) {} });
  }
  function settingsStore() { return store('settings'); }
  const group = {
    id: groupId,
    onChange(fn) { groupSubs.add(fn); return () => groupSubs.delete(fn); },
    async info(gid) {
      const CS = window.CloudSync; gid = gid || groupId(); if (!gid) return null;
      const snap = await CS.K.getDoc(CS.K.doc(CS.db, 'groups', gid));
      return snap.exists() ? Object.assign({ id: gid }, snap.data()) : null;
    },
    async create() {
      const CS = window.CloudSync, u = CS.user;
      const gid = Array.from(crypto.getRandomValues(new Uint8Array(15)), b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
      await CS.K.setDoc(CS.K.doc(CS.db, 'groups', gid), { owner: u.uid, members: [u.uid], names: { [u.uid]: u.displayName || u.email || '가족' }, createdAt: Date.now() });
      settingsStore().setMeta({ groupId: gid }); applyGroup(gid);
      return gid;
    },
    async join(gid) {
      const CS = window.CloudSync, u = CS.user;
      const d = await group.info(gid);
      if (!d || !Array.isArray(d.members) || !d.members.length) throw new Error('없거나 끝난 초대예요.');
      if (!d.members.includes(u.uid)) {
        await CS.K.setDoc(CS.K.doc(CS.db, 'groups', gid), { owner: d.owner, members: d.members.concat([u.uid]),
          names: Object.assign({}, d.names || {}, { [u.uid]: u.displayName || u.email || '가족' }), createdAt: d.createdAt || Date.now() });
      }
      settingsStore().setMeta({ groupId: gid }); applyGroup(gid);
    },
    async leave() {
      const CS = window.CloudSync, u = CS.user, gid = groupId(); if (!gid) return;
      try {
        const d = await group.info(gid);
        if (d && Array.isArray(d.members)) {
          const names = Object.assign({}, d.names || {}); delete names[u.uid];
          await CS.K.setDoc(CS.K.doc(CS.db, 'groups', gid), { owner: d.owner, members: d.members.filter(x => x !== u.uid), names, createdAt: d.createdAt || Date.now() });
        }
      } catch (e) {}
      settingsStore().setMeta({ groupId: null }); applyGroup(null);
    }
  };

  /* ---------- 로그인 상태 ---------- */
  let lastUid;
  function onAuth() {
    const CS = window.CloudSync;
    const uid = CS && CS.user ? CS.user.uid : null;
    if (uid === lastUid) return;
    lastUid = uid;
    if (uid) {
      let owner = null; try { owner = localStorage.getItem(OWNER_KEY); } catch (e) {}
      if (owner && owner !== uid) Object.values(stores).forEach(s => s._reset()); // 다른 계정 기록이 섞이지 않게
      try { localStorage.setItem(OWNER_KEY, uid); } catch (e) {}
      if (owner && owner !== uid) {
        // 아직 안 연 기능의 기록도 비움
        try { Object.keys(localStorage).filter(k => /^life_.+_v1$/.test(k) && k !== OWNER_KEY).forEach(k => localStorage.removeItem(k)); } catch (e) {}
      }
      // 내 설정(가족 공유 여부)을 먼저 붙이고, 바뀌면 공유 기능들을 옮겨 붙임
      const st = settingsStore(); st._attach(uid);
      st.subscribe(() => applyGroup(st.meta().groupId || null));
      Object.values(stores).forEach(s => s._attach(uid));
    } else {
      Object.values(stores).forEach(s => s._detach());
    }
    userSubs.forEach(f => { try { f(CS && CS.user); } catch (e) { console.error(e); } });
  }
  window.addEventListener('cloudsync', onAuth);

  /* ---------- 날씨 (Open-Meteo, 열쇠 필요 없음) ---------- */
  const WX_KEY = 'life_weather_cache_v1';
  const WMO = c => c === 0 ? ['맑음', '☀️'] : c <= 2 ? ['구름 조금', '🌤️'] : c === 3 ? ['흐림', '☁️'] : c <= 48 ? ['안개', '🌫️'] : c <= 57 ? ['이슬비', '🌦️'] : c <= 67 ? ['비', '🌧️'] : c <= 77 ? ['눈', '🌨️'] : c <= 82 ? ['소나기', '🌧️'] : c <= 86 ? ['눈', '🌨️'] : ['뇌우', '⛈️'];
  function weatherPlace() {
    const m = (stores.settings ? stores.settings.meta() : null) || {};
    let local = null; try { local = JSON.parse(localStorage.getItem('life_weather_place_v1')); } catch (e) {}
    return m.weatherPlace || local || { name: '서울', lat: 37.5665, lon: 126.978 };
  }
  async function weather(force) {
    const place = weatherPlace();
    try {
      const c = JSON.parse(localStorage.getItem(WX_KEY));
      if (!force && c && c.place === place.name && Date.now() - c.at < 30 * 60000) return c.w;
    } catch (e) {}
    const u = 'https://api.open-meteo.com/v1/forecast?latitude=' + place.lat + '&longitude=' + place.lon +
      '&current=temperature_2m,apparent_temperature,weather_code,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FSeoul&forecast_days=1';
    const r = await fetch(u); if (!r.ok) throw new Error('날씨를 가져오지 못했어요.');
    const d = await r.json();
    const code = d.current.weather_code, [label, icon] = WMO(code);
    const w = { place: place.name, temp: Math.round(d.current.temperature_2m), feels: Math.round(d.current.apparent_temperature), code, label, icon,
      max: Math.round(d.daily.temperature_2m_max[0]), min: Math.round(d.daily.temperature_2m_min[0]), rain: d.daily.precipitation_probability_max[0], wet: d.current.precipitation > 0 };
    try { localStorage.setItem(WX_KEY, JSON.stringify({ at: Date.now(), place: place.name, w })); } catch (e) {}
    return w;
  }
  // 메뉴 추천의 날씨 칸에 맞춰 바꿈
  function weatherChip(w) {
    if (!w) return '';
    if (w.wet || (w.code >= 51 && w.code <= 82) || w.code >= 95 || w.rain >= 60) return '비';
    if (w.feels <= 5) return '추움';
    if (w.feels >= 27) return '더움';
    return '맑음';
  }
  function setWeatherPlace(place) {
    try { localStorage.setItem('life_weather_place_v1', JSON.stringify(place)); localStorage.removeItem(WX_KEY); } catch (e) {}
    if (window.CloudSync && window.CloudSync.user) settingsStore().setMeta({ weatherPlace: place });
  }

  /* ---------- 앱처럼 설치 ---------- */
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; window.dispatchEvent(new Event('life-install')); });
  window.addEventListener('appinstalled', () => { installEvt = null; window.dispatchEvent(new Event('life-install')); toast('설치됐어요! 홈 화면에서 "생활노트"를 찾아보세요.'); });
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches;
  async function install() {
    if (!installEvt) return false;
    installEvt.prompt();
    const r = await installEvt.userChoice.catch(() => null);
    installEvt = null; window.dispatchEvent(new Event('life-install'));
    return !!(r && r.outcome === 'accepted');
  }
  if (!window.AndroidBridge && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  /* ---------- 중간 서버 호출 ---------- */
  function hasServer() { return !!((window.LIFE_CONFIG || {}).workerUrl); }
  async function api(path, opts) {
    opts = opts || {};
    const base = (window.LIFE_CONFIG || {}).workerUrl;
    if (!base) throw { code: 'no_server', message: '중간 서버가 아직 연결되지 않았어요.' };
    const CS = window.CloudSync;
    if (!CS || !CS.user) throw { code: 'login', message: 'Google 로그인이 필요해요.' };
    const token = await CS.user.getIdToken();
    const url = new URL(path.replace(/^\//, ''), base.replace(/\/?$/, '/'));
    Object.entries(opts.query || {}).forEach(([k, v]) => { if (v != null && v !== '') url.searchParams.set(k, v); });
    let res;
    try {
      res = await fetch(url, {
        method: opts.body ? 'POST' : 'GET',
        headers: Object.assign({ Authorization: 'Bearer ' + token }, opts.body ? { 'Content-Type': 'application/json' } : {}),
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: opts.signal
      });
    } catch (e) {
      if (e && e.name === 'AbortError') throw { code: 'cancelled' };
      throw { code: 'network', message: '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.' };
    }
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw { code: j.error || 'http_' + res.status, message: j.message || '요청을 처리하지 못했어요.', status: res.status };
    return j;
  }

  /* ---------- 시작 ---------- */
  try { if (localStorage.getItem('dark_mode_v1') === '1') document.documentElement.classList.add('ln-dark'); } catch (e) {}
  const CS = window.CloudSync;
  if (CS && !CS.ready) CS.init();
  // 이미 로그인 상태가 정해진 뒤 불린 경우
  setTimeout(onAuth, 0);

  window.Life = {
    h, iso, today, won, newId, daysBetween, prettyDate, WD, toast, sheet,
    store, api, hasServer, group, weather, weatherChip, weatherPlace, setWeatherPlace,
    canInstall: () => !!installEvt, install, standalone,
    onUser(fn) { userSubs.add(fn); try { fn(window.CloudSync && window.CloudSync.user); } catch (e) {} return () => userSubs.delete(fn); },
    user: () => (window.CloudSync && window.CloudSync.user) || null,
    signIn: () => window.CloudSync && window.CloudSync.signInHere()
  };
})();
