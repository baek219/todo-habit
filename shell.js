/* 생활노트 메뉴 (모든 페이지 공통)
 * - PC(넓은 화면): 왼쪽에 메뉴가 항상 보여요.
 * - 폰(좁은 화면): 아래쪽 탭 메뉴(홈·할일·가계부·장보기·더보기). 할일습관 화면은 자기 탭이 있어서 위쪽 ☰ 버튼만.
 * - 페이지마다 '사용법' 버튼을 붙여요.
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
    env: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    fridge: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 10h12M9 6v2M9 13v3"/>',
    broom: '<path d="M14 3l-4 9"/><path d="M6 13h8l3 8H3z"/><path d="M8 17v4M12 17v4"/>',
    cake: '<path d="M4 21h16v-8H4z"/><path d="M4 16c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 4 0"/><path d="M12 13V9M12 6.5c-.8-.8-.8-2 0-3 .8 1 .8 2.2 0 3z"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    run: '<circle cx="14" cy="4.5" r="1.8"/><path d="M8 21l3-6 3 3v4M6 12l3-4 4 1 2 3h3M11 15l-2-2"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 014.8.9c0 1.7-2.4 2.2-2.4 3.6"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
    cross: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'
  };
  const svg = (k) => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>';

  const GROUPS = [
    { sec: 'home', items: [{ href: 'home.html', label: '홈', icon: 'home' }, { href: 'weather.html', label: '날씨', icon: 'sun' }] },
    { title: '기록', sec: 'rec', items: [
      { href: 'index.html', label: '할일·습관', icon: 'check' },
      { href: 'money.html', label: '가계부', icon: 'won' },
      { href: 'gift.html', label: '경조사 장부', icon: 'env' },
      { href: 'workout.html', label: '운동 기록', icon: 'run' }
    ] },
    { title: '우리 집', sec: 'house', items: [
      { href: 'shop.html', label: '장보기', icon: 'cart' },
      { href: 'fridge.html', label: '냉장고', icon: 'fridge' },
      { href: 'chores.html', label: '집안일', icon: 'broom' },
      { href: 'things.html', label: '물건 위치', icon: 'box' },
      { href: 'pet.html', label: '반려동물', icon: 'paw' },
      { href: 'hospital.html', label: '병원 찾기', icon: 'cross' }
    ] },
    { title: '사람', sec: 'people', items: [
      { href: 'dday.html', label: '기념일', icon: 'cake' },
      { href: 'contact.html', label: '연락 챙기기', icon: 'phone' }
    ] },
    { title: '먹고 즐기기', sec: 'food', items: [
      { href: 'menu.html', label: '메뉴 추천', icon: 'bowl' },
      { href: 'food.html', label: '맛집 찾기', icon: 'pin' },
      { href: 'tour.html', label: '명소 찾기', icon: 'flag' }
    ] },
    { title: '도구', sec: 'tool', items: [
      { href: 'calc.html', label: '내 집 마련 계산기', icon: 'house' },
      { href: 'family.html', label: '가족 공유', icon: 'people' },
      { href: 'settings.html', label: '설정·백업', icon: 'gear' }
    ] }
  ];

  // 이 페이지가 어느 묶음인지 → 색 (life.css의 html[data-sec])
  (function () {
    const f = (location.pathname.split('/').pop() || 'index.html') || 'index.html';
    const g = GROUPS.find(g => g.items.some(it => it.href === f));
    document.documentElement.setAttribute('data-sec', g ? g.sec : 'home');
  })();

  const css = `
  @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css");
  :root{--ln-bg:#F3F4F6;--ln-surface:#FFFFFF;--ln-fg:#191F28;--ln-muted:#6B7684;--ln-line:#E9ECF0;--ln-primary:var(--sec,#2563D9);--ln-soft:var(--sec-soft,#E8F0FD);--ln-mark:#FFE58A;--ln-w:252px;
    --ln-font:"Pretendard Variable",Pretendard,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif}
  html.ln-dark{--ln-bg:#101318;--ln-surface:#1A1E25;--ln-fg:#ECEFF3;--ln-muted:#98A2B0;--ln-line:#2B313B;--ln-mark:#6B5A12}
  .ln-group[data-sec="home"]{--g:#2563D9;--gs:#E8F0FD} .ln-group[data-sec="rec"]{--g:#5B4FD6;--gs:#EEECFC} .ln-group[data-sec="house"]{--g:#0B8A5E;--gs:#E2F5EC}
  .ln-group[data-sec="people"]{--g:#D6336C;--gs:#FDE8EF} .ln-group[data-sec="food"]{--g:#C2620A;--gs:#FEF0E1} .ln-group[data-sec="tool"]{--g:#4B5768;--gs:#EDF0F4}
  html.ln-dark .ln-group[data-sec="home"]{--g:#5B9BFF;--gs:#1B2A44} html.ln-dark .ln-group[data-sec="rec"]{--g:#8F86F0;--gs:#262446} html.ln-dark .ln-group[data-sec="house"]{--g:#2FBF86;--gs:#15332A}
  html.ln-dark .ln-group[data-sec="people"]{--g:#F0679A;--gs:#3A1C29} html.ln-dark .ln-group[data-sec="food"]{--g:#F59A3C;--gs:#3A2A16} html.ln-dark .ln-group[data-sec="tool"]{--g:#9AA6B8;--gs:#262C35}
  .ln-side,.ln-top,.ln-bn,.ln-help,.ln-hs{font-family:var(--ln-font);-webkit-font-smoothing:antialiased}
  .ln-side{position:fixed;top:0;bottom:0;left:0;width:var(--ln-w);background:var(--ln-surface);border-right:1px solid var(--ln-line);z-index:60;display:flex;flex-direction:column;
    padding:calc(22px + env(safe-area-inset-top,0px)) 14px calc(16px + env(safe-area-inset-bottom,0px));color:var(--ln-fg);overflow-y:auto}
  .ln-brand{display:flex;align-items:center;gap:11px;padding:0 8px 24px;text-decoration:none;color:var(--ln-fg)}
  .ln-brand img{width:36px;height:36px;border-radius:11px}
  .ln-brand b{display:block;font-size:19px;font-weight:850;letter-spacing:-.04em;line-height:1.2}
  .ln-brand small{display:block;font-size:12px;color:var(--ln-muted);font-weight:500}
  .ln-group{display:flex;flex-direction:column;gap:1px;margin-bottom:14px}
  .ln-gtitle{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;color:var(--ln-muted);padding:4px 10px 6px}
  .ln-gtitle::before{content:"";width:8px;height:8px;border-radius:3px;background:var(--g)}
  .ln-link{display:flex;align-items:center;gap:11px;padding:6px 10px;border-radius:12px;color:var(--ln-fg);text-decoration:none;font-size:15px;font-weight:550;letter-spacing:-.015em;transition:background .12s}
  .ln-ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:var(--gs);color:var(--g);flex:none}
  .ln-ic svg{width:18px;height:18px;stroke-width:1.9}
  .ln-link:hover{background:var(--ln-bg)}
  .ln-link[aria-current="page"]{background:var(--gs);font-weight:750}
  .ln-link[aria-current="page"] .ln-ic{background:var(--g);color:#fff}
  html.ln-dark .ln-link[aria-current="page"] .ln-ic{color:#101318}
  .ln-link:focus-visible,.ln-btn:focus-visible,.ln-top button:focus-visible,.ln-bn a:focus-visible,.ln-bn button:focus-visible,.ln-help:focus-visible{outline:2px solid var(--ln-primary);outline-offset:2px}
  .ln-acc{margin-top:auto;border-top:1px solid var(--ln-line);padding:14px 4px 0;display:grid;gap:9px}
  .ln-who{display:flex;align-items:center;gap:10px;min-width:0}
  .ln-who img{width:32px;height:32px;border-radius:50%;flex:none;background:var(--ln-soft)}
  .ln-who span{font-size:13.5px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ln-who em{display:block;font-style:normal;font-size:11.5px;color:var(--ln-muted);font-weight:500}
  .ln-tip{font-size:11.5px;color:var(--ln-muted);line-height:1.5}
  .ln-btn{border:1px solid var(--ln-line);background:var(--ln-surface);color:var(--ln-fg);border-radius:12px;padding:10px;font:inherit;font-size:14px;font-weight:650;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}
  .ln-btn.ln-dk{background:transparent;border-color:transparent;color:var(--ln-muted);justify-content:flex-start;padding:8px 10px}
  .ln-btn.ln-dk:hover{background:var(--ln-bg);color:var(--ln-fg)}
  .ln-btn.ln-dk svg{width:18px;height:18px}
  .ln-btn.ln-install{background:var(--ln-primary);border-color:var(--ln-primary);color:#fff}
  html.ln-dark .ln-btn.ln-install{color:#0C1611}
  .ln-top,.ln-veil,.ln-bn{display:none}
  /* 사용법 버튼 */
  .ln-help{display:inline-flex;align-items:center;gap:5px;border:0;background:var(--ln-surface);color:var(--ln-muted);border-radius:999px;padding:8px 13px 8px 10px;font-size:13px;font-weight:700;cursor:pointer;line-height:1}
  .ln-help:hover{color:var(--ln-fg)}
  .ln-help svg{width:17px;height:17px;color:var(--ln-primary)}
  .page-head > .ln-help{position:absolute;right:0;top:2px}
  /* 사용법 창 */
  .ln-hveil{position:fixed;inset:0;background:rgba(17,22,30,.45);z-index:95;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(2px)}
  .ln-hs{background:var(--ln-surface);color:var(--ln-fg);width:100%;max-width:540px;border-radius:24px 24px 0 0;padding:24px 22px calc(26px + env(safe-area-inset-bottom,0px));max-height:86vh;overflow-y:auto;display:grid;gap:16px}
  .ln-hs h2{margin:0;font-size:21px;font-weight:800;letter-spacing:-.03em}
  .ln-hs .ln-hsub{margin:-8px 0 0;color:var(--ln-muted);font-size:14px}
  .ln-hs ol{margin:0;padding:0;list-style:none;counter-reset:s;display:grid;gap:12px}
  .ln-hs ol li{counter-increment:s;display:grid;grid-template-columns:28px 1fr;gap:10px;font-size:14.5px;line-height:1.55}
  .ln-hs ol li::before{content:counter(s);width:24px;height:24px;border-radius:8px;background:var(--ln-soft);color:var(--ln-primary);font-weight:800;font-size:13px;display:grid;place-items:center;margin-top:1px}
  .ln-hs ol li b{font-weight:750}
  .ln-hs .ln-htips{background:var(--ln-bg);border-radius:14px;padding:12px 14px;font-size:13.5px;color:var(--ln-muted);display:grid;gap:6px}
  .ln-hs .ln-htips b{color:var(--ln-fg)}
  .ln-hs .ln-hclose{justify-self:stretch;border:0;background:var(--ln-fg);color:var(--ln-bg);border-radius:14px;padding:13px;font:inherit;font-size:15px;font-weight:700;cursor:pointer}
  @media (min-width:700px){.ln-hveil{align-items:center}.ln-hs{border-radius:24px}}
  @media (min-width:960px){
    html.ln-on{padding-left:var(--ln-w)}
    html.ln-on .fab,html.ln-on .bottom-nav{left:var(--ln-w)!important}
  }
  @media (max-width:959.98px){
    .ln-side{transform:translateX(-102%);transition:transform .22s ease;box-shadow:none;background:var(--ln-surface)}
    .ln-side.open{transform:none;box-shadow:0 10px 40px rgba(0,0,0,.25)}
    .ln-veil.open{display:block;position:fixed;inset:0;background:rgba(17,22,30,.45);z-index:59}
    /* 할일습관 화면용 위쪽 줄 */
    .ln-top{display:flex;position:sticky;top:0;z-index:30;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 8px;background:var(--ln-bg);color:var(--ln-fg)}
    .ln-top button.ln-menu{border:1px solid var(--ln-line);background:var(--ln-surface);color:var(--ln-fg);border-radius:12px;width:40px;height:40px;display:grid;place-items:center;cursor:pointer}
    .ln-top b{font-size:16px;font-weight:800;letter-spacing:-.02em}
    .ln-top .ln-cur{color:var(--ln-muted);font-size:14px;font-weight:600}
    .ln-top .ln-help{margin-left:auto}
    /* 아래쪽 탭 메뉴 */
    html.ln-bnon .ln-bn{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;left:0;right:0;bottom:0;z-index:50;background:color-mix(in srgb,var(--ln-surface) 92%,transparent);
      backdrop-filter:saturate(1.4) blur(14px);-webkit-backdrop-filter:saturate(1.4) blur(14px);border-top:1px solid var(--ln-line);padding:6px 6px calc(6px + env(safe-area-inset-bottom,0px))}
    .ln-bn a,.ln-bn button{display:grid;justify-items:center;gap:3px;padding:6px 0 4px;border:0;background:transparent;color:var(--ln-muted);text-decoration:none;font:inherit;font-size:11px;font-weight:600;cursor:pointer;border-radius:12px}
    .ln-bn svg{width:23px;height:23px}
    .ln-bn [aria-current="page"]{color:var(--ln-fg);font-weight:800}
    .ln-bn [aria-current="page"] svg{background:var(--ln-soft);border-radius:10px;padding:3px;width:34px;height:28px;margin:-3px 0 -2px}
    .ln-bn [aria-current="page"] svg{color:var(--ln-primary);stroke-width:2.2}
    html.ln-bnon body{padding-bottom:calc(64px + env(safe-area-inset-bottom,0px))}
  }
  @media (prefers-reduced-motion:reduce){.ln-side{transition:none}}
  `;

  // 할일습관(index.html)을 웹에서 볼 때만 글꼴·테두리·아이콘을 생활노트와 맞춤 (색은 할일습관 설정의 테마를 따름, 안드로이드 앱은 영향 없음)
  const TODO_SKIN = `
  html.ln-on body:not(.dark){--text:#191F28;--text-muted:#6B7684;--border:#E9ECF0}
  html.ln-on body.dark{--text:#ECEFF3;--text-muted:#98A2B0}
  html.ln-on body{font-family:"Pretendard Variable",Pretendard,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;letter-spacing:-.01em}
  html.ln-on .today-card,html.ln-on .todo-item,html.ln-on .habit-item{border-color:transparent}
  html.ln-on .empty-box{border:0;background:var(--surface)}
  html.ln-on .section-title .count{border:0}
  html.ln-on .quick-bar button{border:0;background:var(--primary-soft)}
  html.ln-on .nav-btn .ic svg{width:22px;height:22px;display:block}
  html.ln-on .nav-btn.active .ic{transform:none}
  `;

  function isDark() { try { return localStorage.getItem('dark_mode_v1') === '1'; } catch (e) { return false; } }

  function currentKey() {
    const file = (location.pathname.split('/').pop() || 'index.html');
    const tab = new URLSearchParams(location.search).get('tab');
    return (file === '' ? 'index.html' : file) + (file === 'index.html' && tab && tab !== 'checklist' ? '?tab=' + tab : '');
  }

  /* 페이지별 사용법 */
  const HELP = {
    'home.html': { title: '홈 사용법', sub: '오늘 필요한 것만 한 화면에 모아 보여줘요.', steps: [
      '각 칸 오른쪽 위 글자(예: <b>가계부</b>, <b>목록</b>)를 누르면 그 메뉴로 가요.',
      '맨 위 <b>검색창</b>에 이름·물건·메모·가게 이름을 치면 모든 메뉴에서 한꺼번에 찾아줘요.',
      '<b>홈 꾸미기</b>를 누르면 칸을 빼거나 다시 넣고, ▲▼로 순서를 바꿀 수 있어요.',
      '<b>챙길 것</b>에는 다가오는 기념일·연락할 사람·유통기한 임박 음식·오늘 집안일이 가까운 순으로 모여요.',
      '맨 위 날씨는 <b>날씨</b> 메뉴에서 맨 위에 둔 지역 기준이에요.',
      '<b>Google로 로그인</b>하면 폰·PC의 할 일과 모든 기록이 자동으로 맞춰져요.',
      '폰에서 <b>앱으로 설치</b>가 보이면 눌러 두세요. 홈 화면에 생활노트 아이콘이 생겨요.'
    ], tips: ['챙길 것에는 반려동물 병원·접종은 2주 안, 사료·모래 떨어짐은 1주 안으로 다가온 것만 나와요.'] },
    'weather.html': { title: '날씨 사용법', sub: '여러 지역의 날씨를 한 번에 봐요.', steps: [
      '위쪽 <b>+ 지역 추가</b>를 눌러요.',
      '<b>지금 내 위치 추가</b>를 누르거나, "수지구 동천동"처럼 동네 이름을 검색해서 골라요.',
      '카드의 <b>↑ ↓</b>로 순서를 바꿔요. <b>맨 위 지역</b>이 홈 화면과 메뉴 추천에 쓰여요.',
      '<b>✎</b>로 "집", "회사"처럼 이름을 바꾸고, <b>✕</b>로 뺄 수 있어요.',
      '<b>시간별·주간 예보</b>를 누르면 24시간과 7일 예보가 펼쳐져요.'
    ], tips: ['동네 이름 검색은 로그인했을 때 카카오 지도로 정확하게 찾아요.', '미세먼지는 좋음·보통·나쁨·매우 나쁨 4단계로 보여줘요.'] },
    'index.html': { title: '할일·습관 사용법', sub: '할 일과 매일 지킬 습관을 체크해요.', steps: [
      '오른쪽 아래 <b>+</b> 버튼으로 할 일이나 습관을 추가해요.',
      '<b>체크리스트</b> 탭 맨 위의 초록색 <b>⚡ 빠른 추가</b> 버튼을 누르고 "내일 오후 3시 치과"처럼 말하듯 쓰면 날짜·시간이 알아서 들어가요.',
      '항목 왼쪽 동그라미를 눌러 체크해요. 습관은 날마다 따로 체크돼요.',
      '아래 탭에서 <b>달력</b>, <b>메모</b>, <b>내 기록</b>(통계), <b>설정</b>으로 이동해요.',
      '설정에서 Google로 로그인하면 안드로이드 앱·PC와 기록이 맞춰져요.'
    ], tips: [] },
    'money.html': { title: '가계부 사용법', sub: '쓴 돈을 바로 적고 한 달 흐름을 봐요.', steps: [
      '<b>빠르게 적기</b>에 금액을 넣고 분류를 골라 <b>저장</b>해요. 버는 돈은 위쪽 <b>수입</b>으로 바꿔서 적어요.',
      '<b>◀ ▶</b>로 달을 옮기고, <b>예산 정하기</b>로 한 달 쓸 돈을 정하면 남은 돈이 보여요.',
      '<b>달마다 쓴 돈</b> 막대에서 최근 6달을 비교해요. 막대를 누르면 그달로 이동해요.',
      '통신비·구독료는 <b>+ 고정 지출</b>로 한 번만 등록하면 매달 그날 자동으로 들어가요.',
      '내역을 누르면 고치거나 지울 수 있어요.',
      '<b>카드 문자 붙여넣기</b>로 카드 승인 문자를 여러 개 한꺼번에 붙여넣으면 금액·가게·날짜를 알아서 읽어 넣어요.'
    ], tips: ['<b>가족 공유</b>를 켜면 배우자와 같은 가계부를 같이 써요.', '반려동물 수첩에서 비용을 적으면 여기에도 같이 들어갈 수 있어요.'] },
    'shop.html': { title: '장보기 사용법', sub: '살 것을 적어두고 마트에서 하나씩 체크해요.', steps: [
      '살 것과 수량을 적고 <b>담기</b>를 눌러요.',
      '<b>자주 사는 것</b>에 생긴 버튼을 누르면 바로 담겨요.',
      '마트에서 산 것은 체크해요. 아래 "장바구니에 담음"으로 내려가요.',
      '다 사면 <b>산 것 지우기</b>를 두 번 눌러 정리해요.',
      '장을 다 보고 체크한 뒤 <b>가계부에 적기</b>를 누르면 가격(또는 영수증 합계)을 적어 가계부 "장보기" 지출로 남겨요.'
    ], tips: ['<b>가족 공유</b>를 켜면 한 사람이 담고 다른 사람이 마트에서 체크할 수 있어요.'] },
    'pet.html': { title: '반려동물 수첩 사용법', sub: '병원·접종·사료·몸무게를 한곳에 적어요.', steps: [
      '<b>+ 아이 추가</b>로 이름·종류·생일을 등록해요.',
      '<b>+ 기록</b>에서 병원·예방접종·체중 등을 고르고, <b>다음 일정</b>을 넣으면 D-day로 알려줘요.',
      '비용을 적으면 <b>가계부에도 적기</b>로 가계부(반려동물)에 같이 들어가요.',
      '<b>+ 소모품</b>에 사료·모래를 산 날과 며칠 가는지 넣으면, 떨어질 날짜를 미리 알려줘요.',
      '새로 사면 <b>새로 샀어요</b>를 눌러요. 누를수록 실제 간격에 맞춰 날짜가 정확해져요.'
    ], tips: ['<b>장보기에 담기</b>를 누르면 장보기 목록에 바로 들어가요.'] },
    'menu.html': { title: '메뉴 추천 사용법', sub: '오늘 뭐 먹을지 3가지를 골라줘요.', steps: [
      '끼니·누구랑·기분을 골라요. 날씨는 오늘 날씨로 자동 선택돼요.',
      '<b>AI에게 추천받기</b>: 조건에 맞춰 AI가 골라줘요. (로그인 필요, 하루 10번)',
      '<b>조건으로 바로 뽑기</b>: 로그인 없이 바로 3가지를 뽑아요.',
      '마음에 들면 <b>근처 맛집 찾기</b>로 가게를 찾거나, <b>이걸로 결정</b>을 눌러 기록해요.',
      '<b>냉장고 재료로 집밥 고르기</b>에서 냉장고에 넣어 둔 재료로 해 먹을 메뉴를 뽑고, <b>레시피 보기</b>로 만드는 법을 찾아요.'
    ], tips: ['최근에 정한 메뉴는 다음 추천에서 빠져요.'] },
    'food.html': { title: '맛집 찾기 사용법', sub: '가게를 찾고, 평점·후기를 보고, 내 맛집에 모아요.', steps: [
      '메뉴나 가게 이름을 넣고 <b>찾기</b>를 눌러요. (로그인 필요)',
      '<b>내 위치 주변</b>은 위치 허용이 필요해요. 번거로우면 <b>동네 이름으로</b>를 써요.',
      '<b>구글 평점·후기</b>로 별점·후기·영업시간을 봐요. (하루 30번)',
      '<b>☆ 담기</b>로 내 맛집에 모으고, <b>내 맛집</b> 탭에서 가본 곳·내 별점·메모를 적어요.',
      '<b>목록 공유하기</b>로 만든 주소를 보내면 로그인 없이도 목록을 볼 수 있어요.'
    ], tips: ['찾으면 <b>내 위치 지도</b>가 나와요. 위치가 틀리면 지도에서 진짜 내 위치를 누르면 그 자리 기준으로 다시 찾아요 (6시간 동안 기억).', '위치가 안 잡히면 <b>위치 허용 방법</b> 버튼을 눌러 보세요.'] },
    'calc.html': { title: '내 집 마련 계산기 사용법', sub: '대출이 얼마 필요하고 매달 얼마씩 갚는지 계산해요.', steps: [
      '집값, 가진 돈, 부대비용을 <b>만원</b> 단위로 넣어요. (5억 = 50,000)',
      '금리와 갚는 기간, 갚는 방식을 골라요.',
      '<b>계산 결과</b>에서 매달 갚는 돈, 총 이자를 보고, 그래프로 해마다 원금·이자 비율을 봐요.',
      '<b>거꾸로 계산</b>에 매달 갚을 수 있는 돈을 넣으면 살 수 있는 집값이 나와요.',
      '<b>저장해 둔 계산</b>에 이름을 적고 <b>지금 조건 저장</b>을 누르면 저장한 날짜·시간과 함께 남아요. <b>불러오기</b>로 다시 보고, <b>삭제</b>를 두 번 누르면 지워져요.'
    ], tips: ['입력한 숫자와 저장한 계산은 이 기기에만 남아요.', '실제 대출 한도·금리는 은행 상담에서 꼭 확인하세요.'] },
    'gift.html': { title: '경조사 장부 사용법', sub: '낸 돈·받은 돈을 사람별로 기록해요.', steps: [
      '위쪽에서 <b>내가 냈어요</b>(내가 상대에게 준 돈) 또는 <b>내가 받았어요</b>(상대가 나에게 준 돈)를 골라요.',
      '이름과 금액을 넣으면 "내가 ○○님께 10만원을 드렸어요"처럼 문장으로 한 번 더 보여줘요. 맞는지 확인하세요.',
      '관계와 무슨 일을 골라 <b>저장</b>해요. 원하는 게 없으면 <b>+ 직접 쓰기</b>를 눌러 적으면 돼요.',
      '위쪽 <b>🔍 찾기</b> 탭에서 이름·관계·무슨 일·메모·날짜·금액 아무거나로 찾아요. 예) 친구, 결혼, 2025, 11월, 10만. 띄어 쓰면 모두 들어간 것만 찾아요 (예: 회사 장례).',
      '찾은 기록의 낸 돈·받은 돈 합계와 사람별 합계도 같이 보여줘요.',
      '기록을 누르면 고치거나 지울 수 있어요.',
      '<b>답례 챙기기</b>에는 받기만 하고 아직 낸 적 없는 분이 모여요. <b>낼 때 기록</b>을 누르면 이름·금액이 미리 채워져요.'
    ], tips: ['한 번 적은 이름은 다음에 입력할 때 자동으로 추천돼요.', '"내가 냈어요"로 저장할 때 <b>가계부에도 적기</b>를 켜 두면 가계부 "경조사" 지출에도 같이 들어가요. 고치거나 지우면 가계부도 같이 바뀌어요.', '가족 공유를 켜면 부부가 같은 장부를 써요.'] },
    'fridge.html': { title: '냉장고 사용법', sub: '먼저 먹어야 할 음식부터 알려줘요.', steps: [
      '음식 이름을 적고 냉장·냉동·실온 중 고른 뒤, 유통기한을 넣어요. <b>+3일, +1주</b> 버튼으로 빠르게 정할 수 있어요.',
      '목록은 유통기한이 가까운 것부터 위에 나와요. 3일 안으로 남으면 노란색, 지나면 빨간색이에요.',
      '다 먹으면 <b>다 먹음</b>, 또 사야 하면 <b>또 사기</b>로 장보기에 바로 담아요.'
    ], tips: ['곧 먹어야 할 음식은 홈 화면 "챙길 것"에도 나와요.'] },
    'chores.html': { title: '집안일 사용법', sub: '반복되는 집안일을 나눠서 챙겨요.', steps: [
      '<b>+ 집안일</b>에서 할 일, 얼마나 자주(매일·매주 등), 누가 할지 정해요.',
      '날이 되면 <b>오늘 할 집안일</b>에 올라와요. 하고 나서 <b>했어요</b>를 누르면 다음 날짜가 자동으로 정해져요.',
      '<b>이번 달 누가 했나</b>에서 각자 몇 번 했는지 볼 수 있어요.'
    ], tips: ['가족 공유를 켜야 배우자 이름으로 나눌 수 있어요.'] },
    'dday.html': { title: '기념일 사용법', sub: '생일·기념일이 며칠 남았는지 알려줘요.', steps: [
      '<b>+ 기념일</b>에서 이름과 처음 그날을 넣어요.',
      '<b>해마다</b>: 생일·결혼기념일처럼 매년 돌아오는 날. 음력이면 "음력이에요"를 체크하고 음력 날짜를 넣어요.',
      '<b>며칠째 세기</b>: 사귄 날처럼 그날부터 며칠째인지, 다음 100일 단위가 언제인지 알려줘요.',
      '<b>한 번</b>: 이사·시험처럼 한 번만 있는 날까지 남은 날을 세요.'
    ], tips: ['등록한 기념일은 홈의 "챙길 것"과 "다가오는 기념일"에 가까운 순서로 나와요.'] },
    'contact.html': { title: '연락 챙기기 사용법', sub: '연락할 때가 된 사람을 알려줘요.', steps: [
      '<b>+ 사람</b>에서 이름과 얼마나 자주 연락하고 싶은지 정해요.',
      '때가 되면 <b>연락할 때가 됐어요</b>에 올라와요.',
      '연락하고 나서 <b>연락했어요</b>를 누르면 다음 날짜가 다시 계산돼요.'
    ], tips: ['이 목록은 가족 공유를 켜도 나만 봐요.'] },
    'things.html': { title: '물건 위치 사용법', sub: '가끔 찾는 물건이 어디 있는지 적어둬요.', steps: [
      '<b>+ 물건</b>에서 무엇을, 어디에 뒀는지 적어요. (예: 여권 / 안방 옷장 맨 위 칸)',
      '찾을 때는 위 검색 칸에 이름이나 장소를 쳐요. 찾는 말에 노란 형광펜이 칠해져요.',
      '자리를 옮기면 그 물건을 눌러 장소만 고치면 돼요.',
      '물건을 고칠 때 <b>사진 찍기·고르기</b>로 상자 안 사진을 남길 수 있어요. 사진은 그 기기에만 저장돼요.'
    ], tips: ['검색했는데 없으면 그 자리에서 바로 위치를 적을 수 있어요.'] },
    'workout.html': { title: '운동 기록 사용법', sub: '운동한 날을 달력에 쌓아요.', steps: [
      '운동 종류를 고르고 몇 분 했는지 넣은 뒤 <b>기록</b>을 눌러요.',
      '<b>이번 주</b>에서 목표 횟수까지 얼마나 남았는지 봐요. <b>목표 바꾸기</b>로 횟수를 정할 수 있어요.',
      '달력의 초록 칸이 운동한 날이에요. 1시간 넘게 한 날은 더 진한 초록이에요.',
      '지난 날짜를 누르면 그날로 기록할 수 있어요.',
      '<b>달마다 운동</b> 막대에서 최근 6달을 비교해요. 운동한 날 / 운동 시간을 골라 볼 수 있어요.'
    ], tips: [] },
    'hospital.html': { title: '병원 찾기 사용법', sub: '내 주변 병원·약국을 찾아요.', steps: [
      '<b>소아청소년과</b>, <b>약국</b>처럼 위쪽 버튼을 누르면 바로 내 주변에서 찾아요. 직접 적어서 찾아도 돼요.',
      '<b>내 위치 주변</b>은 위치 허용이 필요해요. 안 되면 <b>동네 이름으로</b>를 누르고 "수지구청역"처럼 적어요.',
      '결과에서 <b>전화</b>, <b>길찾기</b>를 바로 눌러요. 자주 가는 곳은 <b>저장</b>해 두면 <b>저장한 곳</b> 탭에 모여요.',
      '밤·주말에 문 연 곳은 위쪽 <b>응급의료포털</b> 버튼으로 확인해요.'
    ], tips: ['찾으면 <b>내 위치 지도</b>가 나와요. 위치가 틀리면 지도에서 진짜 내 위치를 누르면 그 자리 기준으로 다시 찾아요 (6시간 동안 기억).', '저장한 곳에 진료시간이나 담당 선생님을 메모해 두면 편해요.', '가족 공유를 켜면 저장한 곳을 가족과 같이 봐요.', '검색은 로그인한 뒤 쓸 수 있어요.'] },
    'tour.html': { title: '명소 찾기 사용법', sub: '가볼 만한 곳을 찾고 모아 둬요.', steps: [
      '<b>공원</b>, <b>전시회</b>, <b>캠핑장</b>처럼 위쪽 버튼을 누르거나 가고 싶은 곳을 적어서 찾아요.',
      '거리는 기본 10km예요. 멀리 나가고 싶으면 20km로 바꿔요. 다른 동네는 <b>동네 이름으로</b> 찾아요.',
      '마음에 들면 <b>저장</b> → <b>저장한 곳</b> 탭의 "가볼 곳"에 모여요.',
      '다녀오면 "가볼 곳" 버튼을 눌러 <b>가본 곳</b>으로 바꿔요. 다녀온 날짜도 같이 남아요.'
    ], tips: ['찾으면 <b>내 위치 지도</b>가 나와요. 위치가 틀리면 지도에서 진짜 내 위치를 누르면 그 자리 기준으로 다시 찾아요 (6시간 동안 기억).', '메모에 주차·입장료·휴관일을 적어 두면 다음에 편해요.', '가족 공유를 켜면 가볼 곳 목록을 가족과 같이 봐요.'] },
    'settings.html': { title: '설정·백업 사용법', sub: '화면 밝기와 전체 백업을 관리해요.', steps: [
      '<b>밝게 / 어둡게</b>로 화면 밝기를 바꿔요. 왼쪽 메뉴 맨 아래 버튼으로도 바꿀 수 있어요.',
      '<b>백업 파일 받기</b>를 누르면 모든 메뉴의 기록이 파일 하나로 내려받아져요.',
      '다른 기기나 나중에 <b>백업 파일 고르기</b>로 그 파일을 고르면, 없는 기록만 골라 합쳐 넣어요.',
      '<b>알림 켜기</b>를 누르면 기념일·연락·집안일·유통기한·반려동물 일정이 있는 날 정한 시간에 폰 알림이 와요. 안드로이드 크롬에서 앱으로 설치해 두면 더 잘 와요.'
    ], tips: ['로그인해 두면 백업 없이도 폰·PC 기록이 자동으로 맞춰져요.', '할일·습관 기록은 할일·습관 → 설정에서 따로 백업해요.'] },
    'family.html': { title: '가족 공유 사용법', sub: '가계부·장보기·반려동물을 가족과 같이 써요.', steps: [
      '로그인한 뒤 <b>가족 공유 시작</b>을 눌러요.',
      '나온 <b>초대 주소</b>를 복사해서 가족에게 카톡으로 보내요.',
      '가족이 주소를 열고 Google로 로그인한 뒤 <b>수락하고 같이 쓰기</b>를 누르면 끝이에요.'
    ], tips: ['같이 쓰는 것: 가계부, 장보기, 반려동물, 냉장고, 집안일, 기념일, 경조사 장부, 물건 위치, 병원·명소 저장한 곳', '각자 따로: 할일·습관, 메뉴 기록, 내 맛집, 연락 챙기기, 운동 기록, 계산기', '나가면 다시 내 기록만 보여요.'] }
  };
  function pageFile() { return (location.pathname.split('/').pop() || 'index.html') || 'index.html'; }
  function showHelp() {
    const hp = HELP[pageFile()]; if (!hp) return;
    const veil = document.createElement('div'); veil.className = 'ln-hveil';
    const box = document.createElement('div'); box.className = 'ln-hs'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', hp.title);
    box.innerHTML = '<h2></h2><p class="ln-hsub"></p><ol>' + hp.steps.map(x => '<li><span>' + x + '</span></li>').join('') + '</ol>' +
      ((tips => tips.length ? '<div class="ln-htips">' + tips.map(x => '<span>' + x + '</span>').join('') + '</div>' : '')(hp.tips.concat(window.Life && window.Life.excel && document.querySelector('.ln-xl') ? ['엑셀이나 구글 시트에 적어둔 게 있으면 제목 아래 <b>엑셀로 넣기·받기</b>로 한 번에 넣을 수 있어요. 지금 기록을 엑셀 파일로 받을 수도 있어요.'] : []))) + '<button type="button" class="ln-hclose">알겠어요</button>';
    box.querySelector('h2').textContent = hp.title; box.querySelector('.ln-hsub').textContent = hp.sub;
    const close = () => { veil.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    veil.addEventListener('click', e => { if (e.target === veil) close(); });
    box.querySelector('.ln-hclose').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    veil.appendChild(box); document.body.appendChild(veil);
    box.querySelector('.ln-hclose').focus();
  }
  function helpButton() {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ln-help';
    b.innerHTML = svg('help') + '<span>사용법</span>'; b.setAttribute('aria-label', '이 화면 사용법 보기');
    b.addEventListener('click', showHelp); return b;
  }

  function build() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    document.documentElement.classList.add('ln-on');
    if (isDark()) document.documentElement.classList.add('ln-dark');

    const cur = currentKey();
    const pageHead = document.querySelector('.page-head');
    let curLabel = '';
    const side = document.createElement('nav');
    side.className = 'ln-side'; side.setAttribute('aria-label', '생활노트 메뉴');
    let html = '<a class="ln-brand" href="home.html"><img src="icon-192.png" alt=""><span><b>생활노트</b><small>우리 집 생활 수첩</small></span></a>';
    GROUPS.forEach(g => {
      html += '<div class="ln-group" data-sec="' + g.sec + '">' + (g.title ? '<div class="ln-gtitle">' + g.title + '</div>' : '');
      g.items.forEach(it => {
        const on = it.href === cur || (cur.startsWith('index.html') && it.href === 'index.html'); // 할일습관 안의 달력·메모 탭도 '할일·습관'으로 표시
        if (on) curLabel = it.label;
        html += '<a class="ln-link" href="' + it.href + '"' + (on ? ' aria-current="page"' : '') + '><span class="ln-ic">' + svg(it.icon) + '</span><span>' + it.label + '</span></a>';
      });
      html += '</div>';
    });
    html += '<div class="ln-acc" id="ln-acc"></div>';
    side.innerHTML = html;

    const veil = document.createElement('div'); veil.className = 'ln-veil';
    const open = () => { side.classList.add('open'); veil.classList.add('open'); };
    const close = () => { side.classList.remove('open'); veil.classList.remove('open'); };
    veil.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    if (pageHead) {
      // 생활노트 페이지: 폰에서는 아래쪽 탭 메뉴, 사용법은 제목 옆
      document.documentElement.classList.add('ln-bnon');
      const bn = document.createElement('nav'); bn.className = 'ln-bn'; bn.setAttribute('aria-label', '주요 메뉴');
      const tabs = [['home.html', '홈', 'home'], ['index.html', '할일', 'check'], ['money.html', '가계부', 'won'], ['shop.html', '장보기', 'cart']];
      bn.innerHTML = tabs.map(([href, label, ic]) => '<a href="' + href + '"' + (cur === href ? ' aria-current="page"' : '') + '>' + svg(ic) + '<span>' + label + '</span></a>').join('') +
        '<button type="button"' + (tabs.some(t => t[0] === cur) ? '' : ' aria-current="page"') + '>' + svg('more') + '<span>' + (tabs.some(t => t[0] === cur) ? '더보기' : (curLabel || '더보기')) + '</span></button>';
      bn.querySelector('button').addEventListener('click', open);
      document.body.appendChild(bn);
      if (HELP[pageFile()]) pageHead.appendChild(helpButton());
      // 제목 왼쪽 메뉴 색 아이콘 타일
      const f = pageFile(); let ic = 'home';
      GROUPS.forEach(g => g.items.forEach(it => { if (it.href === f) ic = it.icon; }));
      const tile = document.createElement('span'); tile.className = 'ln-ptile'; tile.setAttribute('aria-hidden', 'true'); tile.innerHTML = svg(ic);
      pageHead.prepend(tile); pageHead.classList.add('ln-tiled');
    } else {
      // 할일습관 화면: 자기 아래 탭이 있으니 위쪽 줄에 메뉴 버튼과 사용법
      const top = document.createElement('div'); top.className = 'ln-top';
      top.innerHTML = '<button type="button" class="ln-menu" aria-label="메뉴 열기">' + svg('menu') + '</button><b>생활노트</b><span class="ln-cur"></span>';
      top.querySelector('.ln-cur').textContent = curLabel ? curLabel : '';
      top.querySelector('.ln-menu').addEventListener('click', open);
      if (HELP[pageFile()]) top.appendChild(helpButton());
      document.body.prepend(top);
      // PC에서는 위쪽 줄이 없으니 머리 부분에 사용법을 붙임
      const hdr = document.querySelector('.header');
      if (hdr && HELP[pageFile()]) { const hb = helpButton(); hb.classList.add('ln-help-pc'); hdr.appendChild(hb); }
      const st2 = document.createElement('style'); st2.textContent = '@media (max-width:959.98px){.ln-help-pc{display:none!important}}' + TODO_SKIN; document.head.appendChild(st2);
      // 할일습관 아래 탭: 이모지 대신 선 아이콘 (웹에서만, 앱은 그대로)
      const NAVIC = { checklist: 'check', calendar: 'cal', notes: 'note', stats: 'chart', settings: 'gear' };
      const swapIcons = () => document.querySelectorAll('#bottom-nav-inner .nav-btn').forEach(b => {
        const ic = b.querySelector('.ic'), k = NAVIC[b.getAttribute('data-tab')];
        if (ic && k && !ic.querySelector('svg')) ic.innerHTML = svg(k);
      });
      const nav = document.getElementById('bottom-nav-inner');
      if (nav) { swapIcons(); new MutationObserver(swapIcons).observe(nav, { childList: true, subtree: true }); }
    }

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
    // 어두운 화면 켜고 끄기
    const dk = document.createElement('button'); dk.type = 'button'; dk.className = 'ln-btn ln-dk';
    dk.innerHTML = svg(isDark() ? 'sun' : 'moon') + '<span>' + (isDark() ? '밝은 화면으로' : '어두운 화면으로') + '</span>';
    dk.addEventListener('click', () => {
      const on = !isDark();
      if (window.Life && window.Life.setDark) window.Life.setDark(on); else { try { localStorage.setItem('dark_mode_v1', on ? '1' : '0'); } catch (e) {} document.documentElement.classList.toggle('ln-dark', on); }
      if (!document.querySelector('.page-head')) { location.reload(); return; } // 할일·습관 화면은 다시 열어야 바뀜
      renderAccount();
    });
    box.appendChild(dk);
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
