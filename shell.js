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
    x: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  const svg = (k) => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>';

  const GROUPS = [
    { items: [{ href: 'home.html', label: '홈', icon: 'home' }, { href: 'weather.html', label: '날씨', icon: 'sun' }] },
    { title: '기록', items: [
      { href: 'index.html', label: '할일·습관', icon: 'check' },
      { href: 'money.html', label: '가계부', icon: 'won' },
      { href: 'gift.html', label: '경조사 장부', icon: 'env' },
      { href: 'workout.html', label: '운동 기록', icon: 'run' }
    ] },
    { title: '우리 집', items: [
      { href: 'shop.html', label: '장보기', icon: 'cart' },
      { href: 'fridge.html', label: '냉장고', icon: 'fridge' },
      { href: 'chores.html', label: '집안일', icon: 'broom' },
      { href: 'things.html', label: '물건 위치', icon: 'box' },
      { href: 'pet.html', label: '반려동물', icon: 'paw' }
    ] },
    { title: '사람', items: [
      { href: 'dday.html', label: '기념일', icon: 'cake' },
      { href: 'contact.html', label: '연락 챙기기', icon: 'phone' }
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
  @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css");
  :root{--ln-bg:#F2F5F2;--ln-surface:#FFFFFF;--ln-fg:#18231D;--ln-muted:#6B7A71;--ln-line:#E3E9E4;--ln-primary:#2B6B57;--ln-soft:#E2EEE8;--ln-mark:#FFE58A;--ln-w:248px;
    --ln-font:"Pretendard Variable",Pretendard,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif}
  html.ln-dark{--ln-bg:#121815;--ln-surface:#1A221E;--ln-fg:#E8EFEA;--ln-muted:#93A59B;--ln-line:#2A3630;--ln-primary:#5DBB98;--ln-soft:#1E3229;--ln-mark:#6B5A12}
  .ln-side,.ln-top,.ln-bn,.ln-help,.ln-hs{font-family:var(--ln-font);-webkit-font-smoothing:antialiased}
  .ln-side{position:fixed;top:0;bottom:0;left:0;width:var(--ln-w);background:var(--ln-bg);border-right:1px solid var(--ln-line);z-index:60;display:flex;flex-direction:column;
    padding:calc(22px + env(safe-area-inset-top,0px)) 14px calc(16px + env(safe-area-inset-bottom,0px));color:var(--ln-fg);overflow-y:auto}
  .ln-brand{display:flex;align-items:center;gap:11px;padding:0 8px 22px;text-decoration:none;color:var(--ln-fg)}
  .ln-brand img{width:36px;height:36px;border-radius:11px}
  .ln-brand b{display:block;font-size:18px;font-weight:800;letter-spacing:-.03em;line-height:1.2}
  .ln-brand small{display:block;font-size:12px;color:var(--ln-muted);font-weight:500}
  .ln-group{display:flex;flex-direction:column;gap:2px;margin-bottom:16px}
  .ln-gtitle{font-size:12px;font-weight:650;color:var(--ln-muted);padding:4px 12px 6px}
  .ln-link{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:12px;color:var(--ln-fg);text-decoration:none;font-size:15px;font-weight:550;letter-spacing:-.01em}
  .ln-link svg{color:var(--ln-muted)}
  .ln-link:hover{background:var(--ln-surface)}
  .ln-link[aria-current="page"]{background:var(--ln-surface);font-weight:750;box-shadow:0 1px 2px rgba(24,35,29,.06),0 0 0 1px var(--ln-line)}
  .ln-link[aria-current="page"] svg{color:var(--ln-primary)}
  .ln-link:focus-visible,.ln-btn:focus-visible,.ln-top button:focus-visible,.ln-bn a:focus-visible,.ln-bn button:focus-visible,.ln-help:focus-visible{outline:2px solid var(--ln-primary);outline-offset:2px}
  .ln-acc{margin-top:auto;border-top:1px solid var(--ln-line);padding:14px 4px 0;display:grid;gap:9px}
  .ln-who{display:flex;align-items:center;gap:10px;min-width:0}
  .ln-who img{width:32px;height:32px;border-radius:50%;flex:none;background:var(--ln-soft)}
  .ln-who span{font-size:13.5px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ln-who em{display:block;font-style:normal;font-size:11.5px;color:var(--ln-muted);font-weight:500}
  .ln-tip{font-size:11.5px;color:var(--ln-muted);line-height:1.5}
  .ln-btn{border:1px solid var(--ln-line);background:var(--ln-surface);color:var(--ln-fg);border-radius:12px;padding:10px;font:inherit;font-size:14px;font-weight:650;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}
  .ln-btn.ln-install{background:var(--ln-primary);border-color:var(--ln-primary);color:#fff}
  html.ln-dark .ln-btn.ln-install{color:#0C1611}
  .ln-top,.ln-veil,.ln-bn{display:none}
  /* 사용법 버튼 */
  .ln-help{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--ln-line);background:var(--ln-surface);color:var(--ln-fg);border-radius:999px;padding:6px 12px 6px 9px;font-size:13px;font-weight:650;cursor:pointer;line-height:1}
  .ln-help svg{width:17px;height:17px;color:var(--ln-primary)}
  .page-head > .ln-help{position:absolute;right:0;top:2px}
  /* 사용법 창 */
  .ln-hveil{position:fixed;inset:0;background:rgba(15,24,19,.42);z-index:95;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(2px)}
  .ln-hs{background:var(--ln-surface);color:var(--ln-fg);width:100%;max-width:540px;border-radius:24px 24px 0 0;padding:24px 22px calc(26px + env(safe-area-inset-bottom,0px));max-height:86vh;overflow-y:auto;display:grid;gap:16px}
  .ln-hs h2{margin:0;font-size:21px;font-weight:800;letter-spacing:-.03em}
  .ln-hs .ln-hsub{margin:-8px 0 0;color:var(--ln-muted);font-size:14px}
  .ln-hs ol{margin:0;padding:0;list-style:none;counter-reset:s;display:grid;gap:12px}
  .ln-hs ol li{counter-increment:s;display:grid;grid-template-columns:28px 1fr;gap:10px;font-size:14.5px;line-height:1.55}
  .ln-hs ol li::before{content:counter(s);width:24px;height:24px;border-radius:50%;background:var(--ln-soft);color:var(--ln-primary);font-weight:800;font-size:13px;display:grid;place-items:center;margin-top:1px}
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
    .ln-veil.open{display:block;position:fixed;inset:0;background:rgba(15,24,19,.42);z-index:59}
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
    .ln-bn [aria-current="page"] svg{color:var(--ln-primary);stroke-width:2.2}
    html.ln-bnon body{padding-bottom:calc(64px + env(safe-area-inset-bottom,0px))}
  }
  @media (prefers-reduced-motion:reduce){.ln-side{transition:none}}
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
      '맨 위 날씨는 <b>날씨</b> 메뉴에서 맨 위에 둔 지역 기준이에요.',
      '<b>Google로 로그인</b>하면 폰·PC의 할 일과 모든 기록이 자동으로 맞춰져요.',
      '폰에서 <b>앱으로 설치</b>가 보이면 눌러 두세요. 홈 화면에 생활노트 아이콘이 생겨요.'
    ], tips: ['반려동물 일정·사료 떨어짐은 7일 안으로 다가온 것만 홈에 나와요.'] },
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
      '통신비·구독료는 <b>+ 고정 지출</b>로 한 번만 등록하면 매달 그날 자동으로 들어가요.',
      '내역을 누르면 고치거나 지울 수 있어요.'
    ], tips: ['<b>가족 공유</b>를 켜면 배우자와 같은 가계부를 같이 써요.', '반려동물 수첩에서 비용을 적으면 여기에도 같이 들어갈 수 있어요.'] },
    'shop.html': { title: '장보기 사용법', sub: '살 것을 적어두고 마트에서 하나씩 체크해요.', steps: [
      '살 것과 수량을 적고 <b>담기</b>를 눌러요.',
      '<b>자주 사는 것</b>에 생긴 버튼을 누르면 바로 담겨요.',
      '마트에서 산 것은 체크해요. 아래 "장바구니에 담음"으로 내려가요.',
      '다 사면 <b>산 것 지우기</b>를 두 번 눌러 정리해요.'
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
      '마음에 들면 <b>근처 맛집 찾기</b>로 가게를 찾거나, <b>이걸로 결정</b>을 눌러 기록해요.'
    ], tips: ['최근에 정한 메뉴는 다음 추천에서 빠져요.'] },
    'food.html': { title: '맛집 찾기 사용법', sub: '가게를 찾고, 평점·후기를 보고, 내 맛집에 모아요.', steps: [
      '메뉴나 가게 이름을 넣고 <b>찾기</b>를 눌러요. (로그인 필요)',
      '<b>내 위치 주변</b>은 위치 허용이 필요해요. 번거로우면 <b>동네 이름으로</b>를 써요.',
      '<b>구글 평점·후기</b>로 별점·후기·영업시간을 봐요. (하루 30번)',
      '<b>☆ 담기</b>로 내 맛집에 모으고, <b>내 맛집</b> 탭에서 가본 곳·내 별점·메모를 적어요.',
      '<b>목록 공유하기</b>로 만든 주소를 보내면 로그인 없이도 목록을 볼 수 있어요.'
    ], tips: ['위치가 안 잡히면 <b>위치 허용 방법</b> 버튼을 눌러 보세요.'] },
    'calc.html': { title: '내 집 마련 계산기 사용법', sub: '대출이 얼마 필요하고 매달 얼마씩 갚는지 계산해요.', steps: [
      '집값, 가진 돈, 부대비용을 <b>만원</b> 단위로 넣어요. (5억 = 50,000)',
      '금리와 갚는 기간, 갚는 방식을 골라요.',
      '<b>계산 결과</b>에서 매달 갚는 돈, 총 이자를 보고, 그래프로 해마다 원금·이자 비율을 봐요.',
      '<b>거꾸로 계산</b>에 매달 갚을 수 있는 돈을 넣으면 살 수 있는 집값이 나와요.'
    ], tips: ['입력한 숫자는 이 기기에만 저장돼요.', '실제 대출 한도·금리는 은행 상담에서 꼭 확인하세요.'] },
    'gift.html': { title: '경조사 장부 사용법', sub: '낸 돈·받은 돈을 사람별로 기록해요.', steps: [
      '위쪽에서 <b>내가 냈어요</b>(내가 상대에게 준 돈) 또는 <b>내가 받았어요</b>(상대가 나에게 준 돈)를 골라요.',
      '이름과 금액을 넣으면 "내가 ○○님께 10만원을 드렸어요"처럼 문장으로 한 번 더 보여줘요. 맞는지 확인하세요.',
      '관계와 무슨 일을 골라 <b>저장</b>해요. 원하는 게 없으면 <b>+ 직접 쓰기</b>를 눌러 적으면 돼요.',
      '위쪽 <b>🔍 찾기</b> 탭에서 이름·관계·무슨 일·메모·날짜·금액 아무거나로 찾아요. 예) 친구, 결혼, 2025, 11월, 10만. 띄어 쓰면 모두 들어간 것만 찾아요 (예: 회사 장례).',
      '찾은 기록의 낸 돈·받은 돈 합계와 사람별 합계도 같이 보여줘요.',
      '기록을 누르면 고치거나 지울 수 있어요.'
    ], tips: ['한 번 적은 이름은 다음에 입력할 때 자동으로 추천돼요.', '가족 공유를 켜면 부부가 같은 장부를 써요.'] },
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
    ], tips: ['30일 안으로 다가온 기념일은 홈 화면에도 나와요.'] },
    'contact.html': { title: '연락 챙기기 사용법', sub: '연락할 때가 된 사람을 알려줘요.', steps: [
      '<b>+ 사람</b>에서 이름과 얼마나 자주 연락하고 싶은지 정해요.',
      '때가 되면 <b>연락할 때가 됐어요</b>에 올라와요.',
      '연락하고 나서 <b>연락했어요</b>를 누르면 다음 날짜가 다시 계산돼요.'
    ], tips: ['이 목록은 가족 공유를 켜도 나만 봐요.'] },
    'things.html': { title: '물건 위치 사용법', sub: '가끔 찾는 물건이 어디 있는지 적어둬요.', steps: [
      '<b>+ 물건</b>에서 무엇을, 어디에 뒀는지 적어요. (예: 여권 / 안방 옷장 맨 위 칸)',
      '찾을 때는 위 검색 칸에 이름이나 장소를 쳐요. 찾는 말에 노란 형광펜이 칠해져요.',
      '자리를 옮기면 그 물건을 눌러 장소만 고치면 돼요.'
    ], tips: ['검색했는데 없으면 그 자리에서 바로 위치를 적을 수 있어요.'] },
    'workout.html': { title: '운동 기록 사용법', sub: '운동한 날을 달력에 쌓아요.', steps: [
      '운동 종류를 고르고 몇 분 했는지 넣은 뒤 <b>기록</b>을 눌러요.',
      '<b>이번 주</b>에서 목표 횟수까지 얼마나 남았는지 봐요. <b>목표 바꾸기</b>로 횟수를 정할 수 있어요.',
      '달력의 초록 칸이 운동한 날이에요. 1시간 넘게 한 날은 더 진한 초록이에요.',
      '지난 날짜를 누르면 그날로 기록할 수 있어요.'
    ], tips: [] },
    'family.html': { title: '가족 공유 사용법', sub: '가계부·장보기·반려동물을 가족과 같이 써요.', steps: [
      '로그인한 뒤 <b>가족 공유 시작</b>을 눌러요.',
      '나온 <b>초대 주소</b>를 복사해서 가족에게 카톡으로 보내요.',
      '가족이 주소를 열고 Google로 로그인한 뒤 <b>수락하고 같이 쓰기</b>를 누르면 끝이에요.'
    ], tips: ['같이 쓰는 것: 가계부, 장보기, 반려동물, 냉장고, 집안일, 기념일, 경조사 장부, 물건 위치', '각자 따로: 할일·습관, 메뉴 기록, 내 맛집, 연락 챙기기, 운동 기록', '나가면 다시 내 기록만 보여요.'] }
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
      const st2 = document.createElement('style'); st2.textContent = '@media (max-width:959.98px){.ln-help-pc{display:none!important}}'; document.head.appendChild(st2);
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
