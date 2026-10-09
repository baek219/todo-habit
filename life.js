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

  function makeStore(name) {
    const LK = 'life_' + name + '_v1';
    const subs = new Set();
    let state = load(), ref = null, unsub = null, pushTimer = null, remoteFp = null, attachedUid = null;

    function load() {
      try { const v = JSON.parse(localStorage.getItem(LK)); if (v && Array.isArray(v.items)) return { items: v.items, meta: v.meta || {}, metaAt: v.metaAt || 0 }; } catch (e) {}
      return { items: [], meta: {}, metaAt: 0 };
    }
    function persist() { try { localStorage.setItem(LK, JSON.stringify(state)); } catch (e) { toast('이 기기에 저장 공간이 부족해요.'); } }
    function notify() { subs.forEach(f => { try { f(api); } catch (e) { console.error(e); } }); }
    function changed() { persist(); notify(); schedulePush(1200); }

    function schedulePush(ms) { if (!ref) return; clearTimeout(pushTimer); pushTimer = setTimeout(push, ms); }
    async function push() {
      if (!ref) return;
      const CS = window.CloudSync, K = CS.K;
      const body = fp(state);
      if (body === remoteFp) return;
      try { await K.setDoc(ref, { v: 1, data: body, updatedAt: Date.now() }); remoteFp = body; }
      catch (e) { toast('클라우드 저장 실패: ' + (e.code || e.message || e)); }
    }

    function attach(uid) {
      if (attachedUid === uid) return;
      detach();
      const CS = window.CloudSync, K = CS.K;
      attachedUid = uid;
      state = load();
      ref = K.doc(CS.db, 'users', uid, 'life', name);
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
      }, err => toast('동기화 오류: ' + (err.code || err.message || err)));
    }
    function detach() { if (unsub) unsub(); unsub = null; ref = null; attachedUid = null; clearTimeout(pushTimer); }
    function reset() { state = { items: [], meta: {}, metaAt: 0 }; persist(); notify(); }

    const api = {
      name,
      items: () => state.items.filter(i => !i.deleted),
      get: id => state.items.find(i => i.id === id && !i.deleted) || null,
      put(item) {
        const now = Date.now();
        const it = Object.assign({}, item, { id: item.id || newId(), updatedAt: now });
        if (!it.createdAt) it.createdAt = now;
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
      Object.values(stores).forEach(s => s._attach(uid));
    } else {
      Object.values(stores).forEach(s => s._detach());
    }
    userSubs.forEach(f => { try { f(CS && CS.user); } catch (e) { console.error(e); } });
  }
  window.addEventListener('cloudsync', onAuth);

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
    store, api, hasServer,
    onUser(fn) { userSubs.add(fn); try { fn(window.CloudSync && window.CloudSync.user); } catch (e) {} return () => userSubs.delete(fn); },
    user: () => (window.CloudSync && window.CloudSync.user) || null,
    signIn: () => window.CloudSync && window.CloudSync.signInHere()
  };
})();
