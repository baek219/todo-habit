// 주변 찾기 (병원 찾기 · 명소 찾기 공용)
// 카카오 지도 검색(중간 서버 /places)을 써요. 찾은 곳은 '저장한 곳'에 담아 가족과 같이 볼 수 있어요.
(function () {
  const L = window.Life; if (!L) return;
  const { h, toast, sheet, today, prettyDate } = L;
  const enc = encodeURIComponent;
  const dist = m => m == null ? '' : m < 1000 ? m + 'm' : (m / 1000).toFixed(1) + 'km';
  const safeUrl = u => /^https:\/\//i.test(String(u || '')) ? String(u) : '';
  const kakaoUrl = p => safeUrl(p.kakaoUrl) || 'https://map.kakao.com/?q=' + enc(p.name);
  const naverUrl = p => 'https://map.naver.com/p/search/' + enc((p.address ? p.address.split(' ').slice(0, 3).join(' ') + ' ' : '') + p.name);
  const routeUrl = p => p.x && p.y ? 'https://map.kakao.com/link/to/' + enc(p.name) + ',' + p.y + ',' + p.x : kakaoUrl(p);

  window.Nearby = function (cfg) {
    const S = L.store('spots');
    const $ = id => document.getElementById(id);
    $('today').textContent = prettyDate(today());
    const mine = () => S.items().filter(x => x.kind === cfg.kind);
    const savedOf = p => mine().find(x => (p.id && x.kakaoId === p.id) || (x.name === p.name && x.address === p.address)) || null;

    /* 탭 */
    let tab = 'search';
    function setTab(t) {
      tab = t;
      document.querySelectorAll('#tabs [data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === t)));
      $('tab-search').hidden = t !== 'search'; $('tab-mine').hidden = t !== 'mine';
      if (t === 'mine') drawMine();
    }
    document.querySelectorAll('#tabs [data-tab]').forEach(b => b.onclick = () => setTab(b.dataset.tab));

    /* 빠른 고르기 */
    let pick = null;
    $('chips').replaceChildren(...cfg.chips.map(c => h('button', { type: 'button', class: 'chip', onclick: e => {
      pick = c; $('q').value = c[0];
      document.querySelectorAll('#chips .chip').forEach(x => x.setAttribute('aria-pressed', String(x === e.currentTarget)));
      search(false);
    } }, c[0])));
    $('q').addEventListener('input', () => { pick = null; document.querySelectorAll('#chips .chip').forEach(x => x.setAttribute('aria-pressed', 'false')); });

    /* 위치 */
    let locMode = 'me', coords = null, page = 1, found = [];
    // 내 위치 지도 (지도를 눌러 위치를 고치면 그 자리 기준으로 다시 찾음)
    const lm = L.locMap($('map-card'), { onPick: c => { coords = c; if ($('q').value.trim()) search(false, true); } });
    const LK = 'nearby_' + cfg.kind + '_';
    function setLoc(m) {
      locMode = m;
      $('loc-me').setAttribute('aria-pressed', String(m === 'me')); $('loc-area').setAttribute('aria-pressed', String(m === 'area'));
      $('area').hidden = m !== 'area'; $('radius').hidden = m !== 'me';
      if (m !== 'me') $('map-card').hidden = true; else if (lm.get()) $('map-card').hidden = false;
      try { localStorage.setItem(LK + 'loc', m); } catch (e) {}
    }
    $('loc-me').onclick = () => setLoc('me'); $('loc-area').onclick = () => { setLoc('area'); $('area').focus(); };
    $('radius').replaceChildren(...cfg.radius.map(([v, l]) => h('option', { value: v, selected: v === cfg.radiusDefault }, l)));
    try { setLoc(localStorage.getItem(LK + 'loc') || 'me'); $('area').value = localStorage.getItem(LK + 'area') || localStorage.getItem('food_area') || ''; } catch (e) {}
    $('loc-help').onclick = () => sheet('위치 허용하는 방법', h('div', { class: 'stack', style: 'gap:12px' },
      h('p', { class: 'small muted' }, '두 가지가 켜져 있어야 해요. ① 폰(또는 PC)의 위치 기능 ② 이 사이트에 위치를 알려줘도 된다는 브라우저 허락.'),
      h('ol', { class: 'small', style: 'margin:0;padding-left:20px;display:grid;gap:6px' },
        h('li', {}, '폰: 화면 맨 위에서 아래로 쓸어내려 "위치"를 켜요.'),
        h('li', {}, '주소창 왼쪽 아이콘(자물쇠 모양)을 눌러 "권한" → "위치" → "허용"으로 바꿔요.'),
        h('li', {}, 'PC(윈도우): 설정 → 개인 정보 및 보안 → 위치 → "위치 서비스"를 켜요.'),
        h('li', {}, '새로고침하고 다시 찾기를 눌러요. 창이 뜨면 "허용".')),
      h('p', { class: 'note' }, '번거로우면 "동네 이름으로"를 누르고 "수지구청역"처럼 적어도 돼요.')));

    function note(msg, warn) { const n = $('note'); n.hidden = !msg; n.className = 'note' + (warn ? ' warn' : ''); if (typeof msg === 'string') n.textContent = msg; else if (msg) n.replaceChildren(msg); }
    function fallback(q) {
      const area = locMode === 'area' ? $('area').value.trim() + ' ' : '';
      $('results').replaceChildren(h('div', { class: 'card' }, h('h3', {}, '"' + q + '" 지도에서 바로 찾기'),
        h('div', { class: 'row' },
          h('a', { class: 'btn sm', href: 'https://map.kakao.com/?q=' + enc(area + q), target: '_blank', rel: 'noopener' }, '카카오맵에서 찾기'),
          h('a', { class: 'btn sm', href: 'https://map.naver.com/p/search/' + enc(area + q), target: '_blank', rel: 'noopener' }, '네이버지도에서 찾기'))));
    }

    function card(p, num) {
      const save = h('button', { class: 'btn sm save-btn', type: 'button', onclick: () => {
        const s = savedOf(p);
        if (s) { S.remove(s.id); toast('저장한 곳에서 뺐어요'); }
        else { S.put({ kind: cfg.kind, kakaoId: p.id || null, name: p.name, category: p.category || '', address: p.address || '', phone: p.phone || '', x: p.x || null, y: p.y || null, kakaoUrl: p.kakaoUrl || '', status: 'want', memo: '' }); toast('"' + p.name + '" 저장했어요'); }
        paint();
      } });
      const paint = () => { const on = !!savedOf(p); save.setAttribute('aria-pressed', String(on)); save.textContent = on ? '저장됨' : '저장'; };
      paint();
      return h('article', { class: 'place' },
        h('div', { class: 'place-top' }, h('div', { class: 'grow' }, h('h3', {}, num ? h('span', { class: 'pin-no' }, num) : null, p.name),
          h('div', { class: 'meta' }, p.category ? h('span', {}, p.category) : null, p.distance != null ? h('span', { class: 'num' }, dist(p.distance)) : null)), save),
        h('div', { class: 'meta' }, p.address ? h('span', {}, p.address) : null, p.phone ? h('span', { class: 'num' }, p.phone) : null),
        h('div', { class: 'links' },
          p.phone ? h('a', { class: 'btn sm soft', href: 'tel:' + p.phone.replace(/[^\d]/g, '') }, '전화') : null,
          h('a', { class: 'btn sm', href: routeUrl(p), target: '_blank', rel: 'noopener' }, '길찾기'),
          h('a', { class: 'btn sm ghost', href: kakaoUrl(p), target: '_blank', rel: 'noopener' }, '카카오맵'),
          h('a', { class: 'btn sm ghost', href: naverUrl(p), target: '_blank', rel: 'noopener' }, '네이버지도')));
    }

    async function search(more, keep) {
      const q = $('q').value.trim();
      if (!q) { $('q').focus(); return; }
      if (!L.hasServer()) { note('검색은 서버 연결 후에 쓸 수 있어요. 지금은 아래 지도 링크로 찾아보세요.', true); fallback(q); return; }
      if (!L.user()) { note(h('span', {}, '주변 검색은 로그인한 분만 쓸 수 있어요. ', h('button', { class: 'btn sm', type: 'button', onclick: () => L.signIn() }, 'Google로 로그인'))); fallback(q); return; }
      note('');
      if (!more) { page = 1; $('results').replaceChildren(h('p', { class: 'empty' }, '찾는 중…')); }
      const kind = pick ? pick[1] : cfg.kindOf(q);
      const query = { q, cat: 'all', page };
      if (kind) query.kind = kind;
      try {
        if (locMode === 'me') {
          if (!coords || (!more && !keep)) coords = await L.myCoords();
          if (!more) lm.show(coords);
          Object.assign(query, { x: coords.x, y: coords.y }, { radius: $('radius').value, sort: 'distance' });
        } else {
          const area = $('area').value.trim();
          if (!area) { note('동네 이름을 넣어 주세요. (예: 수지구청역)', true); $('area').focus(); $('results').replaceChildren(); return; }
          try { localStorage.setItem(LK + 'area', area); } catch (e) {}
          query.q = area + ' ' + q;
        }
        const r = await L.api('places', { query });
        if (!more) { $('results').replaceChildren(); found = []; }
        if (!r.places.length && !more) $('results').append(h('p', { class: 'empty' }, '"' + q + '" 검색 결과가 없어요. ' + (locMode === 'me' ? '거리를 넓히거나 ' : '') + '다른 말로 찾아보세요.'));
        r.places.forEach(p => { found.push(p); $('results').append(card(p, locMode === 'me' ? found.length : 0)); });
        if (locMode === 'me') lm.places(found);
        $('more-row').hidden = r.isEnd || !r.places.length;
      } catch (e) {
        if (!more) $('results').replaceChildren();
        if (e.geo) note(h('span', {}, e.message + ' ', h('button', { class: 'btn sm', type: 'button', onclick: () => $('loc-help').click() }, '위치 허용 방법'), ' 또는 ', h('button', { class: 'btn sm', type: 'button', onclick: () => setLoc('area') }, '동네 이름으로 찾기')), true);
        else note(e.message || '검색하지 못했어요.', true);
      }
    }
    $('form').addEventListener('submit', e => { e.preventDefault(); search(false); });
    $('more').onclick = () => { page++; search(true); };

    /* 저장한 곳 */
    let filter = '';
    function editMemo(x) {
      const memo = h('textarea', { maxlength: '200', placeholder: cfg.memoHint }, x.memo || '');
      const close = sheet(x.name + ' 메모', h('div', { class: 'stack' }, memo,
        h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { S.put(Object.assign({}, x, { memo: memo.value.trim() })); close(); toast('메모를 저장했어요'); } }, '저장'))));
    }
    function drawMine() {
      const all = mine().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      $('mine-count').textContent = all.length ? all.length : '';
      if (cfg.statuses) $('mine-filter').replaceChildren(...[['', '전체']].concat(cfg.statuses).map(([v, l]) => h('button', { type: 'button', 'aria-pressed': String(filter === v), onclick: () => { filter = v; drawMine(); } }, l)));
      const list = all.filter(x => !filter || x.status === filter);
      $('mine').replaceChildren(...(list.length ? list.map(x => {
        let armed = false;
        const del = h('button', { class: 'btn sm ghost', type: 'button', onclick: () => {
          if (!armed) { armed = true; del.textContent = '한 번 더 누르면 삭제'; del.style.color = 'var(--danger)'; return; }
          S.remove(x.id); toast('지웠어요');
        } }, '삭제');
        const st = cfg.statuses ? h('button', { class: 'btn sm ' + (x.status === cfg.statuses[1][0] ? 'soft' : ''), type: 'button', onclick: () => {
          const next = x.status === cfg.statuses[0][0] ? cfg.statuses[1][0] : cfg.statuses[0][0];
          S.put(Object.assign({}, x, { status: next, doneAt: next === cfg.statuses[1][0] ? today() : x.doneAt }));
        } }, x.status === cfg.statuses[1][0] ? cfg.statuses[1][1] + (x.doneAt ? ' · ' + x.doneAt.slice(5).replace('-', '/') : '') : cfg.statuses[0][1]) : null;
        return h('article', { class: 'place' },
          h('div', { class: 'place-top' }, h('div', { class: 'grow' }, h('h3', {}, x.name), h('div', { class: 'meta' }, x.category ? h('span', {}, x.category) : null)), st),
          h('div', { class: 'meta' }, x.address ? h('span', {}, x.address) : null, x.phone ? h('span', { class: 'num' }, x.phone) : null),
          x.memo ? h('p', { class: 'small', style: 'background:var(--surface2);border-radius:10px;padding:8px 10px' }, x.memo) : null,
          h('div', { class: 'links' },
            x.phone ? h('a', { class: 'btn sm soft', href: 'tel:' + x.phone.replace(/[^\d]/g, '') }, '전화') : null,
            h('a', { class: 'btn sm', href: routeUrl(x), target: '_blank', rel: 'noopener' }, '길찾기'),
            h('a', { class: 'btn sm ghost', href: kakaoUrl(x), target: '_blank', rel: 'noopener' }, '카카오맵'),
            h('button', { class: 'btn sm ghost', type: 'button', onclick: () => editMemo(x) }, x.memo ? '메모 고치기' : '메모'),
            h('span', { class: 'spacer' }), del));
      }) : [h('p', { class: 'empty' }, all.length ? '이 조건에 맞는 곳이 없어요.' : cfg.emptyMine)]));
    }
    S.subscribe(() => { if (tab === 'mine') drawMine(); else $('mine-count').textContent = mine().length || ''; });
    $('mine-count').textContent = mine().length || '';
    if (new URLSearchParams(location.search).get('tab') === 'mine') setTab('mine');
  };
})();
