/* 구글 로그인 + 클라우드 동기화 (폰·아이폰·PC 공통)
 * - 데이터는 각 기기의 저장소(localStorage)에 있고, 로그인하면 구글 계정의 클라우드(Firebase)와 맞춰요.
 * - 한 기기에서 바꾸면 1~2초 뒤 클라우드에 올라가고, 다른 기기는 실시간으로 받아와요.
 */
(function () {
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBP1hzU28GlOlL9SIR6Sqd345youZJLrH0",
    authDomain: "checklist-3164e.firebaseapp.com",
    projectId: "checklist-3164e",
    storageBucket: "checklist-3164e.firebasestorage.app",
    messagingSenderId: "603098787728",
    appId: "1:603098787728:web:46b3c4a11f41c0c99e4d15"
  };
  // 로그인 전용 페이지 주소 (GitHub에 올린 웹앱 폴더 안의 login.html)
  const LOGIN_PAGE = 'https://baek219.github.io/todo-habit/login.html';

  // 동기화하는 데이터 (localStorage 키)
  const KEYS = {
    tasks: 'todo_habit_tasks_v3',
    customCategories: 'custom_categories_v1',
    defaultColorOverrides: 'default_cat_colors_v1',
    dayLogs: 'day_logs_v1',
    notes: 'notes_v1',
    appSettings: 'app_settings_v1'
  };
  const DEFAULTS = { tasks: [], customCategories: [], defaultColorOverrides: {}, dayLogs: {}, notes: [], appSettings: {} };
  const META_KEY = 'cloud_sync_meta_v1';

  function readLocal() {
    const out = {};
    Object.keys(KEYS).forEach(k => {
      try { const v = localStorage.getItem(KEYS[k]); out[k] = v ? JSON.parse(v) : JSON.parse(JSON.stringify(DEFAULTS[k])); }
      catch (e) { out[k] = JSON.parse(JSON.stringify(DEFAULTS[k])); }
    });
    return out;
  }
  function writeLocal(state) {
    Object.keys(KEYS).forEach(k => {
      if (state[k] === undefined) return;
      try { localStorage.setItem(KEYS[k], JSON.stringify(state[k])); } catch (e) {}
    });
  }
  function fingerprint(state) {
    return Object.keys(KEYS).map(k => JSON.stringify(state[k] === undefined ? DEFAULTS[k] : state[k])).join('\u0001');
  }
  function hash(str) { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0; return h.toString(36) + ':' + str.length; }
  function isEmpty(state) {
    return !(state.tasks && state.tasks.length) && !(state.notes && state.notes.length) && !Object.keys(state.dayLogs || {}).length;
  }
  function getMeta() { try { return JSON.parse(localStorage.getItem(META_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function setMeta(m) { try { localStorage.setItem(META_KEY, JSON.stringify(Object.assign(getMeta(), m))); } catch (e) {} }
  function deviceId() {
    let m = getMeta();
    if (!m.deviceId) { m.deviceId = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); setMeta({ deviceId: m.deviceId }); }
    return m.deviceId;
  }

  // 두 기기 데이터 합치기 (아무것도 잃어버리지 않도록)
  function merge(local, remote) {
    const out = JSON.parse(JSON.stringify(remote));
    // 할일·습관: 같은 항목이면 체크 기록을 합침, 한쪽에만 있으면 추가
    const byId = {};
    out.tasks = out.tasks || [];
    out.tasks.forEach(t => { byId[t.id] = t; });
    (local.tasks || []).forEach(t => {
      const r = byId[t.id];
      if (!r) { out.tasks.push(t); return; }
      if (t.type === 'habit') {
        r.completedDates = Array.from(new Set([].concat(r.completedDates || [], t.completedDates || [])));
        const c = Object.assign({}, r.counts || {});
        Object.keys(t.counts || {}).forEach(d => { c[d] = Math.max(c[d] || 0, t.counts[d]); });
        r.counts = c;
      } else if (t.done && !r.done) { r.done = true; r.completedAt = t.completedAt; }
    });
    // 카테고리: 이름 기준으로 합침
    const names = new Set((out.customCategories || []).map(c => c.name));
    (local.customCategories || []).forEach(c => { if (!names.has(c.name)) (out.customCategories = out.customCategories || []).push(c); });
    out.defaultColorOverrides = Object.assign({}, local.defaultColorOverrides || {}, remote.defaultColorOverrides || {});
    // 하루 기록: 날짜별로 합침
    out.dayLogs = Object.assign({}, remote.dayLogs || {}, local.dayLogs || {});
    // 메모: 같은 메모면 더 최근에 고친 쪽
    const nb = {};
    (remote.notes || []).forEach(n => { nb[n.id] = n; });
    (local.notes || []).forEach(n => { if (!nb[n.id] || (n.updatedAt || 0) > (nb[n.id].updatedAt || 0)) nb[n.id] = n; });
    out.notes = Object.keys(nb).map(k => nb[k]);
    out.appSettings = Object.assign({}, local.appSettings || {}, remote.appSettings || {});
    out.appSettings.bonusXP = Math.max((local.appSettings || {}).bonusXP || 0, (remote.appSettings || {}).bonusXP || 0);
    return out;
  }

  const CS = {
    ready: false, user: null, status: 'off', lastSyncAt: getMeta().lastSyncAt || 0, error: '',
    LOGIN_PAGE, readLocal, writeLocal, merge, fingerprint, hash,
    // 앱에서 정해주는 함수들
    onRemoteApplied: null,   // 클라우드 데이터를 받아서 저장한 뒤 → 화면 새로고침
    onStatus: null,          // 로그인/동기화 상태가 바뀔 때
    chooseOnFirstLogin: null // 처음 로그인할 때 양쪽에 데이터가 있으면 어떻게 할지 물어봄 → 'merge' | 'cloud' | 'local'
  };
  let auth, db, K, unsub = null, pushTimer = null, lastFp = null, firstLoginPending = false, firstSnapDone = false, triedOld = false;

  function emit() {
    try { CS.onStatus && CS.onStatus(CS); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('cloudsync', { detail: CS })); } catch (e) {} // 왼쪽 메뉴의 로그인 표시용
  }
  function setStatus(st, err) { CS.status = st; CS.error = err || ''; emit(); }

  CS.init = function () {
    K = window.FirebaseKit;
    if (!K) { setStatus('unavailable'); return; }
    try {
      const app = K.initializeApp(FIREBASE_CONFIG);
      auth = K.initializeAuth(app, { persistence: [K.indexedDBLocalPersistence, K.browserLocalPersistence], popupRedirectResolver: K.browserPopupRedirectResolver });
      db = K.initializeFirestore(app, {});
      CS.ready = true;
      CS.db = db; CS.K = K; // 생활노트의 다른 페이지(가계부·반려동물 등)도 같은 로그인·저장소를 씀
    } catch (e) { setStatus('error', '연결 준비 실패: ' + (e.message || e)); return; }
    K.onAuthStateChanged(auth, (user) => {
      CS.user = user;
      if (unsub) { unsub(); unsub = null; }
      if (!user) { setStatus('off'); return; }
      setStatus('syncing');
      startListening(user);
    });
    // 아이폰 등에서 '다른 창으로 이동' 방식 로그인 후 돌아왔을 때
    K.getRedirectResult(auth).catch(() => {});
  };

  function docRef(uid) { return K.doc(db, 'users', uid, 'app', 'data'); }

  function startListening(user) {
    const meta = getMeta();
    firstLoginPending = meta.uid !== user.uid; // 이 기기에서 이 계정으로 처음 로그인
    firstSnapDone = false;
    triedOld = false;
    unsub = K.onSnapshot(docRef(user.uid), async (snap) => {
      if (snap.metadata.hasPendingWrites) return; // 내가 방금 올린 것
      let remote = snap.exists() ? decode(snap.data()) : null;
      let fromOld = false;
      // 예전 웹 버전(v26)이 저장해둔 기록이 있으면 그걸 가져옴 (users/내아이디 문서)
      if (!remote && !triedOld) {
        triedOld = true;
        try {
          const old = await K.getDoc(K.doc(db, 'users', user.uid));
          if (old.exists()) { remote = decodeOld(old.data()); fromOld = true; }
        } catch (e) {}
      }
      const local = readLocal();
      firstSnapDone = true;
      if (firstLoginPending) {
        firstLoginPending = false;
        setMeta({ uid: user.uid });
        let choice = 'cloud';
        if (!remote) choice = 'local';
        else if (isEmpty(local)) choice = 'cloud';
        else if (isEmpty(remote)) choice = 'local';
        else if (fingerprint(local) === fingerprint(remote)) choice = 'cloud';
        else if (CS.chooseOnFirstLogin) { try { choice = await CS.chooseOnFirstLogin(); } catch (e) { choice = 'merge'; } }
        else choice = 'merge';
        if (choice === 'local') { lastFp = null; await pushNow(); return; }
        if (choice === 'merge') { applyMerged(merge(local, remote), remote); await pushNow(); }
        else { applyRemote(remote); if (fromOld) { lastFp = null; await pushNow(); } } // 예전 기록을 새 자리에 옮겨 저장
        return;
      }
      if (!remote) { await pushNow(); return; }
      if (fromOld) { applyMerged(merge(local, remote), remote); lastFp = null; await pushNow(); return; }
      const fpL = fingerprint(local), fpR = fingerprint(remote);
      if (fpR === fpL) { lastFp = fpL; setMeta({ syncedHash: hash(fpL) }); markSynced(); return; }
      const synced = getMeta().syncedHash;
      const localChanged = hash(fpL) !== synced;   // 이 기기에서 아직 안 올린 변경이 있음
      const remoteChanged = hash(fpR) !== synced;  // 다른 기기에서 바뀜
      if (localChanged && !remoteChanged) { await pushNow(); return; }
      if (localChanged && remoteChanged) { applyMerged(merge(local, remote), remote); await pushNow(); return; } // 양쪽 다 바뀜 → 합치기
      applyRemote(remote);
    }, (err) => setStatus('error', '동기화 오류: ' + (err.code || err.message || err)));
  }

  function decode(d) {
    const out = {};
    const data = d.data || {};
    Object.keys(KEYS).forEach(k => {
      try { out[k] = data[k] !== undefined ? JSON.parse(data[k]) : JSON.parse(JSON.stringify(DEFAULTS[k])); }
      catch (e) { out[k] = JSON.parse(JSON.stringify(DEFAULTS[k])); }
    });
    return out;
  }
  // 예전 웹 버전 형식 (할일·카테고리를 그대로 저장했던 방식)
  function decodeOld(d) {
    return {
      tasks: Array.isArray(d.tasks) ? d.tasks : [],
      customCategories: Array.isArray(d.customCategories) ? d.customCategories : [],
      defaultColorOverrides: d.defaultColorOverrides && typeof d.defaultColorOverrides === 'object' ? d.defaultColorOverrides : {},
      dayLogs: {}, notes: [], appSettings: {}
    };
  }
  function encode(state) {
    const data = {};
    Object.keys(KEYS).forEach(k => { data[k] = JSON.stringify(state[k] === undefined ? DEFAULTS[k] : state[k]); });
    return { v: 1, data, updatedAt: Date.now(), deviceId: deviceId() };
  }
  function markSynced() { CS.lastSyncAt = Date.now(); setMeta({ lastSyncAt: CS.lastSyncAt }); setStatus('synced'); }

  function applyRemote(state) {
    writeLocal(state);
    lastFp = fingerprint(readLocal());
    setMeta({ syncedHash: hash(fingerprint(state)) });
    markSynced();
    try { CS.onRemoteApplied && CS.onRemoteApplied(); } catch (e) {}
  }

  // 합친 결과를 이 기기에 저장 (클라우드에는 아직 예전 것이 있으므로, 그 기준으로 기록해두고 곧바로 올림)
  function applyMerged(merged, remote) {
    writeLocal(merged);
    const fpR = fingerprint(remote);
    lastFp = fpR;
    setMeta({ syncedHash: hash(fpR) });
    try { CS.onRemoteApplied && CS.onRemoteApplied(); } catch (e) {}
  }

  async function pushNow() {
    if (!CS.user || !db) return;
    if (!firstSnapDone) return; // 클라우드 내용을 먼저 확인한 뒤에 올림 (다른 기기 변경을 덮어쓰지 않도록)
    const local = readLocal();
    const fp = fingerprint(local);
    if (fp === lastFp) { markSynced(); return; }
    setStatus('syncing');
    try {
      await K.setDoc(docRef(CS.user.uid), encode(local));
      lastFp = fp;
      setMeta({ syncedHash: hash(fp) });
      markSynced();
    } catch (e) { setStatus('error', '저장 실패: ' + (e.code || e.message || e)); }
  }
  CS.pushNow = pushNow;
  CS.schedulePush = function () {
    if (!CS.user) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, 1200);
  };

  // ---- 로그인 ----
  // 1) 안드로이드 앱/PC 프로그램: 로그인 페이지에서 받아온 '구글 확인증(토큰)'으로 로그인
  CS.signInWithIdToken = async function (idToken) {
    if (!CS.ready) return { ok: false, error: '연결 준비가 안 됐어요' };
    try {
      setStatus('signing');
      const cred = K.GoogleAuthProvider.credential(idToken);
      const res = await K.signInWithCredential(auth, cred);
      return { ok: true, user: res.user };
    } catch (e) { setStatus('error', '로그인 실패: ' + (e.code || e.message || e)); return { ok: false, error: e.code || e.message }; }
  };
  // 2) 웹(아이폰·PC 브라우저): 이 페이지에서 바로 구글 로그인 창 띄우기
  CS.signInHere = async function () {
    if (!CS.ready) return { ok: false, error: '연결 준비가 안 됐어요' };
    const provider = new K.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      setStatus('signing');
      const res = await K.signInWithPopup(auth, provider);
      return { ok: true, user: res.user };
    } catch (e) {
      const code = e.code || '';
      if (code.includes('popup-blocked') || code.includes('operation-not-supported')) {
        try { await K.signInWithRedirect(auth, provider); return { ok: true, redirect: true }; } catch (e2) {}
      }
      setStatus(CS.user ? 'synced' : 'off', code.includes('popup-closed') || code.includes('cancelled') ? '' : '로그인 실패: ' + (code || e.message));
      return { ok: false, error: code || e.message };
    }
  };
  CS.signOut = async function () {
    if (!auth) return;
    clearTimeout(pushTimer);
    await pushNow();
    await K.signOut(auth);
    setMeta({ uid: null, syncedHash: null });
    lastFp = null;
  };

  window.CloudSync = CS;
  // 안드로이드 앱/PC 프로그램이 로그인 토큰을 넘겨줄 때 부르는 함수
  window.__onLoginToken = function (t) { if (t) CS.signInWithIdToken(t); };
})();
