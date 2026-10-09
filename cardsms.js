// 카드 승인 문자(카톡 알림 포함)를 읽어서 금액·가게·날짜를 뽑아요. 가계부에서 써요.
// 예) "[Web발신] 신한카드(1234)승인 홍*동 12,000원(일시불)10/09 12:34 스타벅스 누적1,234,560원"
(function () {
  const AMT = /(?:^|[^\d,])(\d{1,3}(?:,\d{3})+|\d{3,9})\s*원/g;
  function amountOf(t) {
    let m, best = null;
    AMT.lastIndex = 0;
    while ((m = AMT.exec(t))) {
      const before = t.slice(Math.max(0, m.index - 6), m.index + 1);
      if (/누적|잔액|한도|포인트|잔여|결제예정/.test(before)) continue;
      best = parseInt(m[1].replace(/,/g, ''), 10); break;
    }
    return best;
  }
  function dateOf(t, now) {
    let m = t.match(/(?:^|[^\d])(\d{1,2})\/(\d{1,2})(?![\d\/])/) || t.match(/(\d{1,2})월\s?(\d{1,2})일/) || t.match(/(?:^|[^\d])(\d{1,2})\.(\d{1,2})(?![\d.])/);
    if (!m) return null;
    const mo = +m[1], d = +m[2]; if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    let y = now.getFullYear(); if (mo > now.getMonth() + 2) y--; // 12월 문자를 1월에 넣는 경우
    return y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }
  function cardOf(t) { const m = t.match(/([가-힣A-Za-z]{1,8}(?:카드|체크|페이))/); return m ? m[1] : ''; }
  function merchantOf(t) {
    let s = t
      .replace(/\[(?:Web발신|국외발신|국제발신)\]/g, ' ')
      .replace(/(누적|잔액|한도|잔여)\s*[:：]?\s*[\d,]+\s*원?/g, ' ')
      .replace(/[\d,]+\s*원(\s*\([^)]*\))?/g, ' ')
      .replace(/(일시불|\d+\s*개월|할부|체크|신용)/g, ' ')
      .replace(/\d{1,2}\/\d{1,2}(\s*\d{1,2}:\d{2}(:\d{2})?)?/g, ' ')
      .replace(/\d{1,2}월\s?\d{1,2}일/g, ' ')
      .replace(/\d{1,2}:\d{2}(:\d{2})?/g, ' ')
      .replace(/[가-힣A-Za-z]{1,8}(카드|페이)\s*(\([^)]*\)|\d{2,4}\*?)?\s*(승인|취소|결제|사용)?(거절)?/g, ' ')
      .replace(/(승인|취소|결제|사용)(되었습니다|완료)?/g, ' ')
      .replace(/[가-힣]\*[가-힣]?\s*님?/g, ' ')
      .replace(/(KB국민|NH농협|IBK기업|SC제일)/g, ' ');
    const parts = s.split(/\n|\|/).map(x => x.replace(/\s+/g, ' ').trim()).filter(x => x.length >= 2 && /[가-힣A-Za-z]/.test(x) && !/^(님|원|일시불)$/.test(x));
    return (parts[parts.length - 1] || '').slice(0, 40);
  }
  function split(text) {
    text = String(text || '').replace(/\r/g, '');
    let chunks = text.split(/(?=\[(?:Web발신|국외발신|국제발신)\])/).map(x => x.trim()).filter(Boolean);
    if (chunks.length <= 1) chunks = text.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
    // 한 덩어리에 승인 문자가 여러 개 붙어 있으면 '○○카드' 줄에서 나눔
    const out = [];
    chunks.forEach(c => {
      const lines = c.split('\n'); let cur = [];
      lines.forEach(l => {
        if (cur.length && /(카드|체크).{0,12}(승인|취소)/.test(l) && amountOf(cur.join('\n')) != null) { out.push(cur.join('\n')); cur = []; }
        cur.push(l);
      });
      if (cur.length) out.push(cur.join('\n'));
    });
    return out;
  }
  function parse(text, now) {
    now = now || new Date();
    return split(text).map(raw => {
      const amount = amountOf(raw);
      if (amount == null) return null;
      return { raw, amount, date: dateOf(raw, now), card: cardOf(raw), merchant: merchantOf(raw), cancel: /취소/.test(raw) };
    }).filter(Boolean);
  }
  window.CardSms = { parse };
  if (typeof module !== 'undefined') module.exports = { parse };
})();
