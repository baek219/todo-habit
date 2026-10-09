// 내 위치 지도: 지금 잡힌 내 위치를 지도에 보여주고, 틀리면 지도에서 눌러 고칠 수 있게 해요.
// 지도: Leaflet + OpenStreetMap (열쇠 필요 없음). 맛집·병원·명소 찾기에서 같이 써요.
(function () {
  const L0 = window.Life; if (!L0) return;
  const { h } = L0;
  const FIX = 'loc_fix_v1', FIX_HOURS = 6;

  let libP = null;
  function loadLeaflet() {
    if (window.L && window.L.map) return Promise.resolve(window.L);
    if (libP) return libP;
    libP = new Promise((ok, no) => {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'vendor/leaflet/leaflet.css'; document.head.append(css);
      const s = document.createElement('script'); s.src = 'vendor/leaflet/leaflet.js';
      s.onload = () => ok(window.L); s.onerror = () => { libP = null; no(new Error('지도를 불러오지 못했어요.')); };
      document.head.append(s);
    });
    return libP;
  }

  // 직접 고른 위치 (6시간 동안 기억)
  function getFix() { try { const f = JSON.parse(localStorage.getItem(FIX)); return f && Date.now() - f.at < FIX_HOURS * 3600000 ? f : null; } catch (e) { return null; } }
  function setFix(c) { try { if (c) localStorage.setItem(FIX, JSON.stringify({ x: c.x, y: c.y, at: Date.now() })); else localStorage.removeItem(FIX); } catch (e) {} }

  // 내 위치 얻기: 직접 고른 위치가 있으면 그것, 없으면 GPS/브라우저 위치
  L0.myCoords = function (opts) {
    const fix = !(opts && opts.gps) && getFix();
    if (fix) return Promise.resolve({ x: fix.x, y: fix.y, acc: 0, manual: true });
    return new Promise((res, rej) => {
      if (!navigator.geolocation) return rej(Object.assign(new Error('이 기기에서는 위치를 쓸 수 없어요.'), { geo: true }));
      navigator.geolocation.getCurrentPosition(p => res({ x: p.coords.longitude, y: p.coords.latitude, acc: Math.round(p.coords.accuracy || 0), manual: false }),
        e => rej(Object.assign(new Error(e.code === 1 ? '위치 사용이 막혀 있어요.' : '현재 위치를 찾지 못했어요. 위치(GPS)가 켜져 있는지 확인해 주세요.'), { geo: true })),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
    });
  };

  // 지도 칸 만들기. onPick(coords): 지도를 눌러 위치를 고쳤을 때
  L0.locMap = function (box, opts) {
    opts = opts || {};
    const title = h('b', {}, '내 위치');
    const sub = h('span', { class: 'small muted' }, '');
    const mapEl = h('div', { class: 'lm-map', role: 'region', 'aria-label': '내 위치 지도' });
    const gpsBtn = h('button', { class: 'btn sm', type: 'button', hidden: true }, 'GPS 위치로 되돌리기');
    const hint = h('p', { class: 'small muted', style: 'margin:0' }, '위치가 틀리면 지도에서 진짜 내 위치를 눌러 주세요. 그 자리 기준으로 다시 찾아요.');
    box.replaceChildren(h('div', { class: 'lm-head' }, h('div', { class: 'stack', style: 'gap:2px' }, title, sub), gpsBtn), mapEl, hint);
    box.hidden = true;
    if (!document.getElementById('lm-style')) document.head.append(h('style', { id: 'lm-style' }, `
      .lm-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
      .lm-map{height:260px;border-radius:16px;overflow:hidden;background:var(--surface2);z-index:0}
      .lm-map .leaflet-control-attribution{font-size:10px}
      .lm-me{width:18px;height:18px;border-radius:50%;background:#2563D9;border:3px solid #fff;box-shadow:0 0 0 2px rgba(37,99,217,.35)}
      .lm-pin{width:24px;height:24px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:var(--sec);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);display:grid;place-items:center}
      .lm-pin span{transform:rotate(45deg);color:#fff;font-size:11px;font-weight:800;font-family:var(--font)}
      @media (max-width:560px){.lm-map{height:220px}}`));
    let map = null, me = null, ring = null, pins = null, cur = null, ready = Promise.resolve();

    async function ensure(c) {
      const L = await loadLeaflet();
      if (map) return L;
      map = L.map(mapEl, { zoomControl: true, attributionControl: true }).setView([c.y, c.x], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
      pins = L.layerGroup().addTo(map);
      map.on('click', e => {
        const c2 = { x: e.latlng.lng, y: e.latlng.lat, acc: 0, manual: true };
        setFix(c2); show(c2);
        if (opts.onPick) opts.onPick(c2);
      });
      return L;
    }
    async function label(c) {
      const acc = c.manual ? '직접 고른 위치예요' : c.acc ? '오차 약 ' + (c.acc >= 1000 ? (c.acc / 1000).toFixed(1) + 'km' : c.acc + 'm') + (c.acc > 500 ? ' — PC나 실내에서는 많이 어긋날 수 있어요' : '') : '';
      sub.textContent = acc;
      title.textContent = '내 위치';
      const r = L0.reversePlace ? await L0.reversePlace(c.y, c.x) : null;
      if (r && cur === c) title.textContent = '내 위치: ' + r.name + (r.sub ? ' ' + r.sub : '');
    }
    function show(c) { ready = draw(c); return ready; }
    async function draw(c) {
      cur = c; box.hidden = false;
      gpsBtn.hidden = !c.manual;
      label(c);
      let L;
      try { L = await ensure(c); } catch (e) { mapEl.replaceChildren(h('p', { class: 'small muted', style: 'padding:14px' }, e.message)); return; }
      setTimeout(() => map.invalidateSize(), 50);
      if (me) me.remove(); if (ring) ring.remove();
      me = L.marker([c.y, c.x], { icon: L.divIcon({ className: '', html: '<div class="lm-me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), title: '내 위치' }).addTo(map);
      ring = c.acc ? L.circle([c.y, c.x], { radius: c.acc, color: '#2563D9', weight: 1, fillOpacity: .08 }).addTo(map) : null;
      map.setView([c.y, c.x], c.acc > 3000 ? 12 : c.acc > 800 ? 14 : 15);
    }
    gpsBtn.onclick = async () => {
      setFix(null);
      try { const c = await L0.myCoords({ gps: true }); show(c); if (opts.onPick) opts.onPick(c); } catch (e) { L0.toast(e.message); }
    };
    // 찾은 곳들을 번호 핀으로
    async function places(list) {
      try { await ready; } catch (e) {}
      if (!map || !cur) return;
      const L = await loadLeaflet();
      pins.clearLayers();
      const pts = [[cur.y, cur.x]];
      (list || []).slice(0, 45).forEach((p, i) => {
        if (!p.x || !p.y) return;
        const y = Number(p.y), x = Number(p.x); pts.push([y, x]);
        L.marker([y, x], { icon: L.divIcon({ className: '', html: '<div class="lm-pin"><span>' + (i + 1) + '</span></div>', iconSize: [24, 24], iconAnchor: [12, 24] }), title: p.name })
          .bindTooltip((() => { const el = document.createElement('span'); el.textContent = (i + 1) + '. ' + p.name; return el; })(), { direction: 'top', offset: [0, -22] }).addTo(pins);
      });
      if (pts.length > 1) map.fitBounds(pts, { padding: [28, 28], maxZoom: 16 });
    }
    return { show, places, get: () => cur };
  };
})();
