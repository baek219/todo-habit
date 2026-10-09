// 알림: 오늘 챙길 것(기념일·연락·집안일·유통기한·반려동물)을 폰 알림으로 알려줘요.
// - 페이지가 앞으로 7일 치 일정을 만들어 '알림 보관함'(Cache)에 넣어 둬요.
// - 서비스워커가 하루에 몇 번 깨어나서(주기 동기화) 오늘 것이 있으면 알림을 띄워요. (안드로이드 크롬에 앱으로 설치했을 때)
// - 사이트를 열었을 때도, 오늘 아직 알림을 안 보냈고 정한 시간이 지났으면 바로 띄워요.
(function () {
  const L = window.Life; if (!L || window.AndroidBridge) return;
  const PREF = 'life_notify_v1', CACHE = 'life-notify', KEY = './__notify.json', SENT = './__notified.json';
  const pref = () => { try { return Object.assign({ on: false, hour: 8, hide: false }, JSON.parse(localStorage.getItem(PREF)) || {}); } catch (e) { return { on: false, hour: 8, hide: false }; } };
  const supported = () => 'Notification' in window && 'serviceWorker' in navigator && 'caches' in window;
  const addDays = (d, n) => { const z = new Date(d + 'T00:00:00'); z.setDate(z.getDate() + Number(n)); return L.iso(z); };

  // 앞으로 7일 동안 챙길 것
  function schedule(prev) {
    const t = L.today(), end = addDays(t, 7), out = [];
    const add = (date, kind, text) => { if (date && date <= end) out.push({ date: date < t ? t : date, kind, text }); };
    const lunarOk = !!window.KoreanLunarCalendar;
    if (lunarOk) L.store('dday').items().forEach(x => {
      const nx = L.ddayNext(x); if (!(nx.n >= 0)) return;
      if (x.kind === 'count') { if (nx.days > 0) add(nx.date, 'dday', x.title + ' ' + nx.milestone); return; }
      add(nx.date, 'dday', x.title); if (nx.n >= 1) add(addDays(nx.date, -1), 'dday', '내일 ' + x.title);
    });
    else (prev || []).filter(e => e.kind === 'dday' && e.date >= t).forEach(e => out.push(e)); // 음력 계산 도구가 없는 페이지에서는 전에 만든 것 유지
    L.store('contacts').items().forEach(x => add(x.last ? addDays(x.last, x.every || 14) : t, 'contact', x.name + '님께 연락하기'));
    L.store('chores').items().forEach(x => { let d = x.start || t; if (x.last) { d = addDays(x.last, x.every || 7); if (x.start && x.start > d) d = x.start; } add(d, 'chore', x.name); });
    L.store('fridge').items().forEach(x => { if (x.exp) add(addDays(x.exp, -1), 'fridge', x.name + ' 유통기한 임박'); });
    const pets = L.store('pets'), pl = L.store('petlog').items();
    pl.filter(r => r.next && pets.get(r.petId) && !pl.some(o => o.petId === r.petId && o.type === r.type && o.date > r.date && o.id !== r.id))
      .forEach(r => add(r.next, 'pet', pets.get(r.petId).name + ' ' + r.type));
    L.store('supplies').items().forEach(x => { if (x.last && x.days) add(addDays(x.last, Number(x.days) - 2), 'pet', x.name + ' 곧 떨어져요'); });
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }

  async function readJson(key) { try { const c = await caches.open(CACHE); const r = await c.match(key); return r ? await r.json() : null; } catch (e) { return null; } }
  async function writeJson(key, v) { try { const c = await caches.open(CACHE); await c.put(key, new Response(JSON.stringify(v), { headers: { 'Content-Type': 'application/json' } })); } catch (e) {} }

  let timer = null;
  async function save() {
    const p = pref(); if (!p.on || !supported()) return;
    const old = await readJson(KEY);
    const items = schedule(old && old.items);
    await writeJson(KEY, { hour: p.hour, hide: !!p.hide, items, at: Date.now() });
    maybeShowNow(items);
  }
  const later = () => { clearTimeout(timer); timer = setTimeout(save, 1500); };

  async function maybeShowNow(items) {
    const p = pref(); if (!p.on || Notification.permission !== 'granted') return;
    const t = L.today(); if (new Date().getHours() < p.hour) return;
    const sent = await readJson(SENT); if (sent && sent.date === t) return;
    const todays = (items || []).filter(e => e.date === t); if (!todays.length) return;
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification('오늘 챙길 것 ' + todays.length + '개', { body: p.hide ? '생활노트를 열어 확인해 주세요.' : todays.slice(0, 5).map(e => '· ' + e.text).join('\n') + (todays.length > 5 ? '\n외 ' + (todays.length - 5) + '개' : ''), icon: 'icon-192.png', badge: 'icon-192.png', tag: 'life-today', data: { url: 'home.html' } });
    await writeJson(SENT, { date: t });
  }

  async function registerPeriodic() {
    try {
      const reg = await navigator.serviceWorker.ready;
      if ('periodicSync' in reg) {
        const st = await navigator.permissions.query({ name: 'periodic-background-sync' }).catch(() => null);
        if (!st || st.state === 'granted') await reg.periodicSync.register('life-remind', { minInterval: 6 * 3600 * 1000 });
        return true;
      }
    } catch (e) {}
    return false;
  }

  L.notify = {
    supported, pref,
    async enable(hour) {
      if (!supported()) throw new Error('이 브라우저는 알림을 지원하지 않아요.');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') throw new Error('알림이 막혀 있어요. 주소창 왼쪽 자물쇠 → 권한 → 알림을 "허용"으로 바꿔 주세요.');
      try { localStorage.setItem(PREF, JSON.stringify(Object.assign(pref(), { on: true, hour: hour == null ? pref().hour : hour }))); } catch (e) {}
      const bg = await registerPeriodic();
      await save();
      return bg;
    },
    setHide(v) { const p = pref(); p.hide = !!v; try { localStorage.setItem(PREF, JSON.stringify(p)); } catch (e) {} save(); },
    disable() { try { localStorage.setItem(PREF, JSON.stringify(Object.assign(pref(), { on: false }))); } catch (e) {} writeJson(KEY, { hour: 0, items: [], at: Date.now() }); },
    setHour(h) { const p = pref(); p.hour = h; try { localStorage.setItem(PREF, JSON.stringify(p)); } catch (e) {} save(); },
    async test() {
      const reg = await navigator.serviceWorker.ready;
      const items = schedule((await readJson(KEY) || {}).items).filter(e => e.date === L.today());
      await reg.showNotification('생활노트 알림 시험', { body: items.length ? '오늘 챙길 것: ' + items.map(e => e.text).join(', ') : '알림이 잘 와요. 챙길 것이 있는 날 아침에 알려드릴게요.', icon: 'icon-192.png', tag: 'life-test', data: { url: 'home.html' } });
    },
    today: () => schedule().filter(e => e.date === L.today())
  };

  if (pref().on && supported()) {
    ['dday', 'contacts', 'chores', 'fridge', 'pets', 'petlog', 'supplies'].forEach(n => L.store(n).subscribe(later));
    later();
  }
})();
