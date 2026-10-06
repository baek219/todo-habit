/* 말로 빠르게 추가: '내일 오후 3시 치과' → { title: '치과', date, time: '15:00' }
 * 폰 앱과 PC 달력이 같이 써요 (window.QuickParse)
 */
(function () {
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function add(d, n) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; }
  const WD = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };
  const NUM = { '한': 1, '두': 2, '세': 3, '네': 4, '다섯': 5, '여섯': 6, '일곱': 7, '여덟': 8, '아홉': 9, '열': 10, '열한': 11, '열두': 12 };
  function num(x) { return /^\d+$/.test(x) ? parseInt(x, 10) : (NUM[x] || NaN); }
  function dim(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function nextMonthDay(base, day) {
    let d = new Date(base.getFullYear(), base.getMonth(), Math.min(day, dim(base.getFullYear(), base.getMonth())));
    if (d < base) d = new Date(base.getFullYear(), base.getMonth() + 1, Math.min(day, dim(base.getFullYear(), base.getMonth() + 1)));
    return d;
  }
  function nextMD(base, m, day) {
    let d = new Date(base.getFullYear(), m - 1, Math.min(day, dim(base.getFullYear(), m - 1)));
    if (d < base) d = new Date(base.getFullYear() + 1, m - 1, Math.min(day, dim(base.getFullYear() + 1, m - 1)));
    return d;
  }
  function lunarToSolar(y, m, d) {
    try {
      if (!window.KoreanLunarCalendar) return null;
      const lc = new window.KoreanLunarCalendar();
      if (!lc.setLunarDate(y, m, d, false)) return null;
      const s = lc.getSolarCalendar();
      return new Date(s.year, s.month - 1, s.day);
    } catch (e) { return null; }
  }

  function parse(text, now) {
    now = now || new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let s = ' ' + String(text || '').replace(/\s+/g, ' ') + ' ';
    const out = { title: '', date: null, endDate: null, time: null, repeat: null, lunar: false, important: false, found: [] };
    const cut = (re, fn) => { const m = s.match(re); if (!m) return false; const r = fn(m); if (r === false) return false; s = s.replace(m[0], ' ').replace(/\s+/g, ' '); if (s[0] !== ' ') s = ' ' + s; if (s[s.length - 1] !== ' ') s += ' '; return true; };

    // 중요
    cut(/\s(?:⭐|!+|중요(?:한)?(?:\s?일정)?)(?=\s)/, () => { out.important = true; });
    // 음력
    if (cut(/\s음력(?=\s)/, () => {})) out.lunar = true;

    // 따로 떨어진 '매년'/'매달'/'매주' (예: '엄마 생신 음력 9월 3일 매년')
    let loose = null;
    cut(/\s매(년|해|달|월|주)(?:마다)?(?=\s)(?!\s?\d|\s?[일월화수목금토]요일|\s?말일)/, m => { loose = /년|해/.test(m[1]) ? 'yearly' : /주/.test(m[1]) ? 'weekly' : 'monthly'; });
    // ---- 반복 ----
    cut(/\s매주\s?([일월화수목금토])요일(?:마다)?(?=\s)/, m => { out.repeat = 'weekly'; const w = WD[m[1]]; out.date = iso(add(base, (w - base.getDay() + 7) % 7)); });
    if (!out.repeat) cut(/\s매(?:달|월)\s?(?:말일|마지막\s?날)(?:마다)?(?=\s)/, () => { out.repeat = 'monthEnd'; out.lunar = false; out.date = iso(new Date(base.getFullYear(), base.getMonth() + 1, 0)); });
    if (!out.repeat) cut(/\s매(?:달|월)\s?(\d{1,2})일(?:마다)?(?=\s)/, m => {
      out.repeat = 'monthly'; const day = +m[1];
      if (out.lunar) { /* 음력 매달: 이번 달 음력 그날을 양력으로 */
        const r = window.Repeat && window.Repeat.lunarOf ? window.Repeat.lunarOf(iso(base)) : null;
        const sd = r ? lunarToSolar(base.getFullYear(), r.month, day) : null;
        out.date = sd ? iso(sd < base ? (lunarToSolar(base.getFullYear(), r.month + 1 > 12 ? 1 : r.month + 1, day) || sd) : sd) : iso(nextMonthDay(base, day));
      } else out.date = iso(nextMonthDay(base, day));
    });
    if (!out.repeat) cut(/\s매(?:년|해)\s?(\d{1,2})월\s?(\d{1,2})일(?:마다)?(?=\s)/, m => {
      out.repeat = 'yearly';
      if (out.lunar) {
        let sd = lunarToSolar(base.getFullYear(), +m[1], +m[2]);
        if (sd && sd < base) sd = lunarToSolar(base.getFullYear() + 1, +m[1], +m[2]);
        out.date = sd ? iso(sd) : iso(nextMD(base, +m[1], +m[2]));
      } else out.date = iso(nextMD(base, +m[1], +m[2]));
    });
    const lunarWanted = out.lunar;
    if (!out.repeat && !loose) out.lunar = false;

    // ---- 날짜 (기간 포함) ----
    function oneDate(str) {
      str = str.trim();
      let m;
      if (/^오늘$/.test(str)) return base;
      if (/^내일$/.test(str)) return add(base, 1);
      if (/^모레$/.test(str)) return add(base, 2);
      if (/^글피$/.test(str)) return add(base, 3);
      if ((m = str.match(/^(\d{1,3})일\s?(?:뒤|후)$/))) return add(base, +m[1]);
      if ((m = str.match(/^(\d{1,2})주\s?(?:뒤|후)$/))) return add(base, +m[1] * 7);
      if ((m = str.match(/^(다음\s?주|담주|이번\s?주|다다음\s?주)?\s?([일월화수목금토])요일$/))) {
        const w = WD[m[2]];
        if (!m[1]) return add(base, (w - base.getDay() + 7) % 7);
        const mon = add(base, -((base.getDay() + 6) % 7)); // 이번 주 월요일
        const wk = /다다음/.test(m[1]) ? 2 : /이번/.test(m[1]) ? 0 : 1;
        return add(mon, wk * 7 + ((w + 6) % 7));
      }
      if ((m = str.match(/^다음\s?달\s?(\d{1,2})일$/))) return new Date(base.getFullYear(), base.getMonth() + 1, Math.min(+m[1], dim(base.getFullYear(), base.getMonth() + 1)));
      if ((m = str.match(/^(?:(\d{4})년\s?)?(\d{1,2})월\s?(\d{1,2})일$/))) return m[1] ? new Date(+m[1], +m[2] - 1, +m[3]) : nextMD(base, +m[2], +m[3]);
      if ((m = str.match(/^(\d{1,2})[\/.](\d{1,2})$/))) return nextMD(base, +m[1], +m[2]);
      if ((m = str.match(/^(\d{1,2})일$/))) return nextMonthDay(base, +m[1]);
      return null;
    }
    const DATE = '(?:오늘|내일|모레|글피|\\d{1,3}일\\s?(?:뒤|후)|\\d{1,2}주\\s?(?:뒤|후)|(?:(?:다음\\s?주|담주|이번\\s?주|다다음\\s?주)\\s?)?[일월화수목금토]요일|다음\\s?달\\s?\\d{1,2}일|(?:\\d{4}년\\s?)?\\d{1,2}월\\s?\\d{1,2}일|\\d{1,2}[\\/.]\\d{1,2}|\\d{1,2}일)';
    if (!out.repeat || out.repeat) {
      // 기간: A부터 B까지 / A~B
      const rr = new RegExp('\\s(' + DATE + ')\\s?(?:부터|~|-|에서)\\s?(' + DATE + ')(?:\\s?까지)?(?=\\s)');
      const ok = cut(rr, m => {
        const a = oneDate(m[1]); let b = m[2];
        // '6일~10일'처럼 달이 없으면 앞 날짜의 달을 따름
        let bd = oneDate(b);
        const dOnly = b.match(/^(\d{1,2})일$/);
        if (a && dOnly) bd = new Date(a.getFullYear(), a.getMonth(), +dOnly[1]);
        const bm = b.match(/^(\d{1,2})월\s?(\d{1,2})일$/);
        if (a && bm) { bd = new Date(a.getFullYear(), +bm[1] - 1, +bm[2]); if (bd < a) bd = new Date(a.getFullYear() + 1, +bm[1] - 1, +bm[2]); }
        if (!a || !bd) return false;
        if (!out.date || !out.repeat) out.date = iso(a);
        if (bd > a) out.endDate = iso(bd);
      });
      if (!ok && !out.repeat) cut(new RegExp('\\s(' + DATE + ')(?:에|까지|날)?(?=\\s)'), m => {
        let d = oneDate(m[1]); if (!d) return false;
        const lm = m[1].match(/^(\d{1,2})월\s?(\d{1,2})일$/);
        if (lunarWanted && lm) { // 음력 날짜 → 양력으로
          let sd = lunarToSolar(base.getFullYear(), +lm[1], +lm[2]);
          if (sd && sd < base) sd = lunarToSolar(base.getFullYear() + 1, +lm[1], +lm[2]);
          if (sd) d = sd;
        }
        out.date = iso(d);
      });
      if (loose && !out.repeat) { out.repeat = loose; out.lunar = lunarWanted && loose !== 'weekly'; }
    }

    // ---- 시간 ----
    cut(/\s(오전|오후|아침|낮|점심|저녁|밤|새벽)?\s?(\d{1,2}|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|열한|열두)\s?시\s?(?:(\d{1,2})\s?분|(반))?(?:에|까지|쯤)?(?=\s)/, m => {
      let h = num(m[2]); if (isNaN(h) || h > 24) return false;
      const mi = m[4] ? 30 : m[3] ? +m[3] : 0;
      const mer = m[1] || '';
      if (/오후|저녁|밤/.test(mer) && h < 12) h += 12;
      else if (/낮|점심/.test(mer) && h < 6) h += 12;
      else if (/오전|아침|새벽/.test(mer) && h === 12) h = 0;
      else if (!mer && h >= 1 && h <= 7) h += 12; // '3시 치과' → 오후 3시로
      out.time = pad(h % 24) + ':' + pad(Math.min(59, mi));
    }) || cut(/\s(?:(오전|오후|저녁|밤|아침)\s?)?(\d{1,2}):(\d{2})(?:에|까지)?(?=\s)/, m => { let h = +m[2]; if (h > 23) return false; if (m[1] && /오후|저녁|밤/.test(m[1]) && h < 12) h += 12; out.time = pad(h) + ':' + m[3]; });
    if (!out.time) cut(/\s(정오)(?=\s)/, () => { out.time = '12:00'; });

    out.title = s.replace(/\s(?:에|까지|부터|날|에는|엔)(?=\s)/g, ' ').replace(/\s+/g, ' ').trim();
    if (!out.date) out.date = iso(base);
    return out;
  }
  window.QuickParse = { parse };
})();
