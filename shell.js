/* 생활노트 왼쪽 메뉴 (모든 페이지 공통)
 * - PC(넓은 화면): 왼쪽에 메뉴가 항상 보여요.
 * - 폰(좁은 화면): 위쪽 줄의 ☰ 버튼을 누르면 왼쪽에서 메뉴가 나와요.
 * - 안드로이드 앱 안에서는 앱 자체 메뉴를 쓰므로 나타나지 않아요.
 */
(function () {
  if (window.AndroidBridge) return;
  if (window.__lnShell) return;
  window.__lnShell = true;

  const ICON = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    check: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 12l3 3 5-6"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    note: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    won: '<path d="M4 6l3 12 3-9 2 6 2-6 3 9 3-12"/><path d="M3 11h18"/>',
    paw: '<circle cx="7" cy="9" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="9" r="2"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5c0 2-2 3-4 3s-4-1-4-3z"/>',
    bowl: '<path d="M3 11h18a9 9 0 01-18 0z"/><path d="M8 7c0-2 2-2 2-4M13 7c0-2 2-2 2-4"/>',
    pin: '<path d="M12 21s7-6.5 7-12a7 7 0 00-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    cart: '<path d="M3 4h2l2.4 11h10.2L20 8H7"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
    house: '<path d="M4 11l8-6 8 6v9H4z"/><path d="M9 20v-5h6v5"/>',
    people: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5M15 14.5c2.5 0 6 1.2 6 4.5"/>',
    down: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  const svg = (k) => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>';

  const GROUPS = [
    { items: [{ href: 'home.html', label: '홈', icon: 'home' }, { href: 'weather.html', label: '날씨', icon: 'sun' }] },
    { title: '기록', items: [
      { href: 'index.html', label: '할일·습관', icon: 'check' },
      { href: 'money.html', label: '가계부', icon: 'won' },
      { href: 'shop.html', label: '장보기', icon: 'cart' },
      { href: 'pet.html', label: '반려동물', icon: 'paw' }
    ] },
    { title: '먹고 즐기기', items: [
      { href: 'menu.html', label: '메뉴 추천', icon: 'bowl' },
      { href: 'food.html', label: '맛집 찾기', icon: 'pin' }
    ] },
    { title: '도구', items: [
      { href: 'calc.html', label: '내 집 마련 계산기', icon: 'house' },
      { href: 'family.html', label: '가족 공유', icon: 'people' }
    ] }
  ];

  const css = `
  :root{--ln-bg:#EFF4F1;--ln-surface:#FFFFFF;--ln-fg:#223028;--ln-muted:#728075;--ln-line:#E1E8E2;--ln-primary:#2F6F5E;--ln-soft:#DCEAE4;--ln-w:236px}
  html.ln-dark{--ln-bg:#17201C;--ln-surface:#1F2B25;--ln-fg:#E9F1EC;--ln-muted:#8FA69C;--ln-line:#2C3B34;--ln-primary:#4CA98A;--ln-soft:#24352D}
  .ln-side{position:fixed;top:0;bottom:0;left:0;width:var(--ln-w);background:var(--ln-surface);border-right:1px solid var(--ln-line);z-index:60;display:flex;flex-direction:column;
    padding:calc(18px + env(safe-area-inset-top,0px)) 12px calc(14px + env(safe-area-inset-bottom,0px));font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Segoe UI",sans-serif;color:var(--ln-fg);overflow-y:auto}
  .ln-brand{display:flex;align-items:center;gap:10px;padding:0 8px 16px;text-decoration:none;color:var(--ln-fg)}
  .ln-brand img{width:34px;height:34px;border-radius:9px}
  .ln-brand b{font-size:17px;font-weight:800;letter-spacing:-.01em}
  .ln-brand small{display:block;font-size:11px;color:var(--ln-muted);font-weight:600}
  .ln-group{display:flex;flex-direction:column;gap:2px;margin-bottom:12px}
  .ln-gtitle{font-size:11px;font-weight:700;color:var(--ln-muted);letter-spacing:.08em;padding:6px 10px 4px}
  .ln-link{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;color:var(--ln-fg);text-decoration:none;font-size:15px;font-weight:600}
  .ln-link:hover{background:var(--ln-bg)}
  .ln-link[aria-current="page"]{background:var(--ln-soft);color:var(--ln-primary)}
  .ln-link:focus-visible,.ln-btn:focus-visible,.ln-top button:focus-visible{outline:2px solid var(--ln-primary);outline-offset:2px}
  .ln-acc{margin-top:auto;border-top:1px solid var(--ln-line);padding:12px 6px 0;display:grid;gap:8px}
  .ln-who{display:flex;align-items:center;gap:9px;min-width:0}
  .ln-who img{width:30px;height:30px;border-radius:50%;flex:none;background:var(--ln-soft)}
  .ln-who span{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ln-who em{display:block;font-style:normal;font-size:11px;color:var(--ln-muted);font-weight:500}
  .ln-tip{font-size:11px;color:var(--ln-muted);line-height:1.45}
  .ln-btn{border:1.5px solid var(--ln-line);background:var(--ln-surface);color:var(--ln-fg);border-radius:10px;padding:9px 10px;font:inherit;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}
  .ln-btn.g{border-color:#dadce0}
  .ln-btn.ln-install{background:var(--ln-primary);border-color:var(--ln-primary);color:#fff}
  html.ln-dark .ln-btn.ln-install{color:#0F1A15}
  .ln-top{display:none}
  .ln-veil{display:none}
  @media (min-width:960px){
    html.ln-on{padding-left:var(--ln-w)}
    html.ln-on .fab,html.ln-on .bottom-nav{left:var(--ln-w)!important}
  }
  @media (max-width:959.98px){
    .ln-side{transform:translateX(-102%);transition:transform .22s ease;box-shadow:none}
    .ln-side.open{transform:none;box-shadow:0 10px 40px rgba(0,0,0,.25)}
    .ln-veil.open{display:block;position:fixed;inset:0;background:rgba(20,30,25,.45);z-index:59}
    .ln-top{display:flex;position:sticky;top:0;z-index:30;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top,0px)) 12px 8px;background:var(--ln-bg);
      font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Segoe UI",sans-serif;color:var(--ln-fg)}
    .ln-top button{border:1px solid var(--ln-line);background:var(--ln-surface);color:var(--ln-fg);border-radius:10px;width:40px;height:40px;display:grid;place-items:center;cursor:pointer}
    .ln-top b{font-size:16px;font-weight:800}
    .ln-top .ln-cur{color:var(--ln-muted);font-size:14px;font-weight:600}
  }
  @media (prefers-reduced-motion:reduce){.ln-side{transition:none}}
  `;

  function isDark() { try { return localStorage.getItem('dark_mode_v1') === '1'; } catch (e) { return false; } }

  function currentKey() {
    const file = (location.pathname.split('/').pop() || 'index.html');
    const tab = new URLSearchParams(location.search).get('tab');
    return (file === '' ? 'index.html' : file) + (file === 'index.html' && tab && tab !== 'checklist' ? '?tab=' + tab : '');
  }

  function build() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    document.documentElement.classList.add('ln-on');
    if (isDark()) document.documentElement.classList.add('ln-dark');

    const cur = currentKey();
    let curLabel = '';
    const side = document.createElement('nav');
    side.className = 'ln-side'; side.setAttribute('aria-label', '생활노트 메뉴');
    let html = '<a class="ln-brand" href="home.html"><img src="icon-192.png" alt=""><span><b>생활노트</b><small>할일 · 기록 · 날씨 · 맛집</small></span></a>';
    GROUPS.forEach(g => {
      html += '<div class="ln-group">' + (g.title ? '<div class="ln-gtitle">' + g.title + '</div>' : '');
      g.items.forEach(it => {
        const on = it.href === cur || (cur.startsWith('index.html') && it.href === 'index.html'); // 할일습관 안의 달력·메모 탭도 '할일·습관'으로 표시
        if (on) curLabel = it.label;
        html += '<a class="ln-link" href="' + it.href + '"' + (on ? ' aria-current="page"' : '') + '>' + svg(it.icon) + '<span>' + it.label + '</span></a>';
      });
      html += '</div>';
    });
    html += '<div class="ln-acc" id="ln-acc"></div>';
    side.innerHTML = html;

    const veil = document.createElement('div'); veil.className = 'ln-veil';
    const top = document.createElement('div'); top.className = 'ln-top';
    top.innerHTML = '<button type="button" aria-label="메뉴 열기">' + svg('menu') + '</button><b>생활노트</b><span class="ln-cur"></span>';
    top.querySelector('.ln-cur').textContent = curLabel ? '· ' + curLabel : '';

    const open = () => { side.classList.add('open'); veil.classList.add('open'); };
    const close = () => { side.classList.remove('open'); veil.classList.remove('open'); };
    top.querySelector('button').addEventListener('click', open);
    veil.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    document.body.prepend(top);
    document.body.appendChild(veil);
    document.body.appendChild(side);
    renderAccount();
    window.addEventListener('cloudsync', renderAccount);
    window.addEventListener('life-install', renderAccount);
    // 다른 페이지에서 다크모드를 바꾸면 따라감
    window.addEventListener('storage', e => { if (e.key === 'dark_mode_v1') document.documentElement.classList.toggle('ln-dark', isDark()); });
    // 할일습관 화면 안의 다크모드 버튼과도 맞춤
    new MutationObserver(() => document.documentElement.classList.toggle('ln-dark', document.body.classList.contains('dark') || isDark()))
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  const G_LOGO = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

  function renderAccount() {
    const box = document.getElementById('ln-acc'); if (!box) return;
    const CS = window.CloudSync;
    box.replaceChildren();
    if (window.Life && window.Life.canInstall && window.Life.canInstall()) {
      const ib = document.createElement('button'); ib.type = 'button'; ib.className = 'ln-btn ln-install';
      ib.innerHTML = svg('down') + '<span>앱으로 설치</span>';
      ib.addEventListener('click', () => window.Life.install());
      box.appendChild(ib);
    }
    if (!CS || !CS.ready) {
      const p = document.createElement('div'); p.className = 'ln-who';
      p.innerHTML = '<span>로그인 준비 중…</span>'; box.appendChild(p); return;
    }
    if (CS.user) {
      const u = CS.user;
      const who = document.createElement('div'); who.className = 'ln-who';
      const img = document.createElement('img'); img.alt = ''; if (u.photoURL) img.src = u.photoURL; img.referrerPolicy = 'no-referrer';
      const sp = document.createElement('span');
      sp.textContent = u.displayName || u.email || '로그인됨';
      const em = document.createElement('em');
      em.textContent = CS.status === 'syncing' ? '동기화 중…' : CS.status === 'error' ? '동기화 문제 있음' : '폰·PC 자동 동기화 켜짐';
      sp.appendChild(em); who.append(img, sp);
      const out = document.createElement('button'); out.type = 'button'; out.className = 'ln-btn'; out.textContent = '로그아웃';
      out.addEventListener('click', async () => { out.disabled = true; try { await CS.signOut(); } finally { location.reload(); } });
      box.append(who, out);
    } else {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ln-btn g';
      btn.innerHTML = G_LOGO + '<span>Google로 로그인</span>';
      btn.addEventListener('click', async () => { btn.disabled = true; try { await CS.signInHere(); } finally { btn.disabled = false; } });
      const tip = document.createElement('div'); tip.className = 'ln-tip';
      tip.textContent = '로그인하면 폰·PC 기록이 자동으로 맞춰져요';
      box.append(btn, tip);
    }
  }

  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
