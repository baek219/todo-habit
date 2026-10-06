/* 반복 계산 (할일·메모 공통, 폰 앱과 PC 달력이 같이 써요)
 * repeat: 'none' | 'weekly' | 'monthly' | 'monthEnd'(매달 말일) | 'yearly'
 * lunar : true 면 음력 기준 (매달 음력 15일, 매년 음력 8월 15일 같은 것)
 * start : 첫 날짜 'YYYY-MM-DD',  end : 기간이 있으면 끝나는 날 (없으면 하루짜리)
 */
(function () {
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(ds, n) { const d = new Date(ds + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); }
  function diffDays(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }
  function dim(y, m) { return new Date(y, m, 0).getDate(); } // m: 1~12

  // 양력 날짜 → 음력 (한 번 계산한 건 기억해둠)
  const cache = {};
  function lunarOf(ds) {
    if (Object.prototype.hasOwnProperty.call(cache, ds)) return cache[ds];
    let r = null;
    try {
      if (window.KoreanLunarCalendar) {
        const lc = new window.KoreanLunarCalendar();
        lc.setSolarDate(+ds.slice(0, 4), +ds.slice(5, 7), +ds.slice(8, 10));
        const l = lc.getLunarCalendar();
        r = { month: l.month, day: l.day, leap: !!l.intercalation };
      }
    } catch (e) {}
    return (cache[ds] = r);
  }
  // 음력 그달의 마지막 날인지 (29일로 끝나는 달 대비)
  function isLunarMonthEnd(ds) { const n = lunarOf(addDays(ds, 1)); return !!n && n.day === 1; }

  function isRepeat(rep) { return rep === 'weekly' || rep === 'monthly' || rep === 'monthEnd' || rep === 'yearly'; }
  function isMonthEnd(ds) { return addDays(ds, 1).slice(8, 10) === '01'; }

  // c 날짜가 '한 회차의 시작일'인가?
  function isStart(start, rep, lunar, c) {
    if (!start || c < start) return false;
    if (!isRepeat(rep)) return c === start;
    if (rep === 'weekly') return diffDays(start, c) % 7 === 0;
    if (rep === 'monthEnd') return isMonthEnd(c); // 매달 말일 (2월 28·29일, 4월 30일, 3월 31일 …)
    const sm = +start.slice(5, 7), sd = +start.slice(8, 10);
    const cy = +c.slice(0, 4), cm = +c.slice(5, 7), cd = +c.slice(8, 10);
    if (!lunar) {
      const want = Math.min(sd, dim(cy, cm)); // 31일 → 30일까지인 달은 마지막 날
      if (rep === 'monthly') return cd === want;
      if (rep === 'yearly') return cm === sm && cd === want; // 2월 29일 → 평년엔 28일
      return false;
    }
    const L0 = lunarOf(start), L = lunarOf(c);
    if (!L0 || !L || L.leap) return false; // 윤달은 건너뜀
    const dayOk = L.day === L0.day || (L0.day === 30 && L.day === 29 && isLunarMonthEnd(c));
    if (rep === 'monthly') return dayOk;
    if (rep === 'yearly') return L.month === L0.month && dayOk;
    return false;
  }

  function span(start, end) { return end && start && end > start ? Math.min(diffDays(start, end), 366) : 0; }

  // ds 날짜를 포함하는 회차의 시작일 (없으면 null)
  function occStartOn(start, end, rep, lunar, ds) {
    if (!start || ds < start) return null;
    const n = span(start, end);
    for (let k = 0; k <= n; k++) {
      const c = addDays(ds, -k);
      if (c < start) break;
      if (isStart(start, rep, lunar, c)) return c;
    }
    return null;
  }

  // from 날짜에 진행 중이거나, 그 뒤 가장 가까운 회차의 시작일
  function nextOcc(start, end, rep, lunar, from) {
    const cur = occStartOn(start, end, rep, lunar, from);
    if (cur) return cur;
    if (!isRepeat(rep)) return start >= from ? start : null;
    let c = from > start ? from : start;
    for (let i = 0; i < 800; i++, c = addDays(c, 1)) if (isStart(start, rep, lunar, c)) return c;
    return null;
  }

  // from~to 사이에 걸리는 회차 시작일 목록
  function occList(start, end, rep, lunar, from, to) {
    const out = [];
    if (!start) return out;
    let c = addDays(from, -span(start, end));
    if (c < start) c = start;
    if (!isRepeat(rep)) { if (start <= to && addDays(start, span(start, end)) >= from) out.push(start); return out; }
    for (let i = 0; c <= to && i < 4000; i++, c = addDays(c, 1)) if (isStart(start, rep, lunar, c)) out.push(c);
    return out;
  }

  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  // 설명 글자 (예: '매년 음력 8월 15일')
  function describe(start, rep, lunar) {
    if (!start || !isRepeat(rep)) return '';
    if (rep === 'weekly') return '매주 ' + WD[new Date(start + 'T00:00:00').getDay()] + '요일';
    if (rep === 'monthEnd') return '매달 말일';
    if (lunar) {
      const L = lunarOf(start);
      if (!L) return rep === 'yearly' ? '매년 (음력)' : '매달 (음력)';
      return rep === 'yearly' ? `매년 음력 ${L.month}월 ${L.day}일` : `매달 음력 ${L.day}일`;
    }
    return rep === 'yearly' ? `매년 ${+start.slice(5, 7)}월 ${+start.slice(8, 10)}일` : `매달 ${+start.slice(8, 10)}일`;
  }

  /* ---- 교대근무 ----
   * shift: { id, name, pattern: ['주','주','야','야','비','휴','휴'], start: 'YYYY-MM-DD'(첫 근무 날), mode: 'off'|'all', offBi: 비번도 쉬는 날로 볼지 }
   */
  const SHIFT_NAMES = { '주': '주간', '오': '오후', '야': '야간', '비': '비번', '휴': '휴무' };
  function shiftCode(sh, ds) {
    if (!sh || !sh.start || !sh.pattern || !sh.pattern.length) return null;
    const n = sh.pattern.length;
    const k = ((diffDays(sh.start, ds) % n) + n) % n;
    return sh.pattern[k];
  }
  function shiftOff(sh, ds) { const c = shiftCode(sh, ds); return c === '휴' || (!!sh.offBi && c === '비'); }
  // ds가 쉬는 날이면 이어지는 쉬는 날 묶음 { s, e }
  function shiftRun(sh, ds) {
    if (!shiftOff(sh, ds)) return null;
    let s = ds, e = ds;
    for (let i = 0; i < 31 && shiftOff(sh, addDays(s, -1)); i++) s = addDays(s, -1);
    for (let i = 0; i < 31 && shiftOff(sh, addDays(e, 1)); i++) e = addDays(e, 1);
    return { s, e };
  }
  // 달력에 보여줄 글자: { label, s, e } (쉬는 날만 모드면 이어진 기간), 없으면 null
  function shiftItem(sh, ds) {
    if (!sh || sh.hidden) return null;
    if (sh.mode === 'all') {
      const c = shiftCode(sh, ds); if (!c) return null;
      return { label: (sh.name ? sh.name + ' ' : '') + (SHIFT_NAMES[c] || c), s: ds, e: ds, code: c };
    }
    const r = shiftRun(sh, ds); if (!r) return null;
    return { label: (sh.name ? sh.name + ' ' : '') + '쉬는날', s: r.s, e: r.e, code: '휴' };
  }

  window.Repeat = { isRepeat, isStart, occStartOn, nextOcc, occList, describe, span, lunarOf, addDays, diffDays, isMonthEnd, shiftCode, shiftOff, shiftRun, shiftItem, SHIFT_NAMES };
})();
