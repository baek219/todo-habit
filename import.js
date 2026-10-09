// 엑셀·구글 시트에 적어둔 기록을 한 번에 넣고, 지금 기록을 엑셀 파일로 내려받는 기능
// 각 페이지에서 Life.excel({ ... }) 로 켜요. 제목 옆에 "엑셀로 넣기·받기" 버튼이 생겨요.
(function () {
  const L = window.Life; if (!L) return;
  const { h, toast, sheet, iso, today } = L;

  const css = `
  .xl-steps{margin:0;padding-left:20px;display:grid;gap:4px;font-size:14px}
  .xl-cols{display:flex;flex-wrap:wrap;gap:6px}
  .xl-cols span{font-size:12.5px;font-weight:650;background:var(--surface2);border-radius:999px;padding:4px 10px}
  .xl-cols span.req{background:var(--primary-soft);color:var(--primary-dark)}
  .xl-map{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px 8px;align-items:start}
  .xl-map label{display:grid;gap:4px;font-size:13px;font-weight:650;align-content:start}
  .xl-map select,.xl-map input{font-size:14px;padding:8px 10px}
  .xl-map label.fix{background:var(--mark);border-radius:12px;padding:6px;margin:-6px}
  .xl-map label.fix>span{color:#4A3B00}
  .xl-prev{overflow-x:auto;border:1px solid var(--line);border-radius:12px}
  .xl-prev table{border-collapse:collapse;width:100%;font-size:13px;white-space:nowrap}
  .xl-prev th,.xl-prev td{padding:7px 10px;border-bottom:1px solid var(--line);text-align:left}
  .xl-prev th{background:var(--surface2);font-weight:700}
  .xl-prev tr:last-child td{border-bottom:0}
  .xl-sum{font-size:14px;font-weight:650}
  .xl-err{font-size:13px;color:var(--danger);margin:0;padding-left:18px}
  .xl-ta{min-height:120px!important;font-size:13px!important;font-family:ui-monospace,Menlo,monospace!important}
  `;
  document.head.append(h('style', {}, css));

  /* ---------- 글자 → 표 ---------- */
  function parseText(text) {
    text = String(text || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    const first = text.split('\n').find(l => l.trim()) || '';
    const delim = first.includes('\t') ? '\t' : (first.split(',').length > 1 ? ',' : first.includes(';') ? ';' : '\t');
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"' && cell === '') q = true;
      else if (c === delim) { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.map(r => r.map(v => v.trim())).filter(r => r.some(v => v !== ''));
  }

  /* ---------- 칸 하나 읽기 ---------- */
  const norm = s => String(s == null ? '' : s).toLowerCase().replace(/[\s()（）\[\]{}·:./_\-*]/g, '');
  const pad = n => String(n).padStart(2, '0');
  function okDate(y, m, d) {
    if (y < 100) y += 2000;
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? y + '-' + pad(m) + '-' + pad(d) : null;
  }
  function parseDate(v) {
    if (v instanceof Date && !isNaN(v)) return iso(v);
    let s = String(v).trim(); if (!s) return null;
    if (/^\d{5}(\.\d+)?$/.test(s)) { const n = Number(s); if (n > 20000 && n < 80000) { const d = new Date(Math.round((n - 25569) * 86400000)); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); } }
    let m;
    if ((m = s.match(/^(\d{4})(\d{2})(\d{2})$/))) return okDate(+m[1], +m[2], +m[3]);
    s = s.replace(/\(.*?\)/g, '').replace(/[년월]/g, '-').replace(/일/g, '').replace(/[.\/]/g, '-').replace(/\s+/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if ((m = s.match(/^(\d{4}|\d{2})-(\d{1,2})-(\d{1,2})/))) return okDate(+m[1], +m[2], +m[3]);
    if ((m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/))) return okDate(+m[3], +m[1], +m[2]); // 3/5/2024 (미국식)
    if ((m = s.match(/^(\d{1,2})-(\d{1,2})$/))) return okDate(new Date().getFullYear(), +m[1], +m[2]);
    return null;
  }
  function parseAmount(v) {
    if (typeof v === 'number') return Math.round(v);
    let s = String(v).replace(/[\s,원₩\\]/g, ''); if (!s) return null;
    const neg = /^[-−△▲]/.test(s) || /^\(.*\)$/.test(s);
    let n = 0, m;
    if ((m = s.match(/([\d.]+)억/))) n += parseFloat(m[1]) * 1e8;
    if ((m = s.match(/([\d.]+)천만/))) n += parseFloat(m[1]) * 1e7;
    else if ((m = s.match(/([\d.]+)만/))) n += parseFloat(m[1]) * 1e4;
    if ((m = s.match(/만([\d.]+)천$/))) n += parseFloat(m[1]) * 1e3;
    else if ((m = s.match(/만([\d.]+)$/))) n += parseFloat(m[1]);
    if (!n) { const d = s.replace(/[^\d.]/g, ''); if (!d) return null; n = parseFloat(d); if ((m = s.match(/천$/))) n *= 1e3; }
    if (isNaN(n)) return null;
    return Math.round(neg ? -n : n);
  }
  function parseDays(v) { // 주기: "매주", "2주", "한 달마다", "3" → 날 수
    if (typeof v === 'number') return v > 0 ? Math.round(v) : null;
    const s = norm(v); if (!s) return null;
    const words = { 매일: 1, 이틀: 2, 사흘: 3, 매주: 7, 일주: 7, 격주: 14, 매달: 30, 매월: 30, 한달: 30, 두달: 60, 석달: 90, 세달: 90, 분기: 90, 반년: 180, 일년: 365, 매년: 365 };
    for (const k in words) if (s.includes(k)) return words[k];
    let m;
    if ((m = s.match(/(\d+)(개월|달|월)/))) return +m[1] * 30;
    if ((m = s.match(/(\d+)주/))) return +m[1] * 7;
    if ((m = s.match(/(\d+)년/))) return +m[1] * 365;
    if ((m = s.match(/(\d+)/))) return +m[1];
    return null;
  }
  function parseBool(v) { const s = norm(v); return !!s && /^(o|y|yes|true|1|예|네|ㅇ|음력|v|✓|✔)$/.test(s); }
  function parseChoice(v, f) {
    const s = norm(v); if (!s) return undefined;
    for (const opt of f.options) { const [val, ...names] = opt; if (names.concat([val]).some(n => norm(n) === s)) return val; }
    if (f.keepRaw) return String(v).trim().slice(0, 20); // 목록에 없는 말은 적힌 그대로
    for (const opt of f.options) { const [val, ...names] = opt; if (names.concat([val]).some(n => { const k = norm(n); return k.length >= 1 && (s.includes(k) || (s.length >= 2 && k.includes(s))); })) return val; }
    return f.other !== undefined ? f.other : undefined;
  }
  function readCell(v, f) {
    if (v == null || String(v).trim() === '') return undefined;
    switch (f.type) {
      case 'date': return parseDate(v) || { bad: true };
      case 'amount': { const n = parseAmount(v); return n == null ? { bad: true } : n; }
      case 'number': { const n = parseFloat(String(v).replace(/[^\d.\-]/g, '')); return isNaN(n) ? { bad: true } : n; }
      case 'days': return parseDays(v) || { bad: true };
      case 'bool': return parseBool(v);
      case 'choice': return parseChoice(v, f);
      default: return String(v instanceof Date ? iso(v) : v).trim();
    }
  }

  /* ---------- 제목 줄 알아보기 ---------- */
  function scoreHeader(cell, f) {
    const c = norm(cell); if (!c) return 0;
    const names = [f.label].concat(f.aliases || []).map(norm).filter(Boolean);
    if (names.includes(c)) return 3;
    if (names.some(n => n.length >= 2 && c.includes(n))) return 2;
    if (names.some(n => c.length >= 2 && n.includes(c))) return 1;
    return 0;
  }
  function autoMap(header, fields) {
    const map = {}, used = new Set();
    const pairs = [];
    fields.forEach(f => header.forEach((cell, i) => { const s = scoreHeader(cell, f); if (s) pairs.push([s, f.key, i]); }));
    pairs.sort((a, b) => b[0] - a[0]);
    pairs.forEach(([, k, i]) => { if (map[k] == null && !used.has(i)) { map[k] = i; used.add(i); } });
    return map;
  }
  function looksLikeHeader(row, fields) {
    const hits = row.filter(c => fields.some(f => scoreHeader(c, f) >= 2)).length;
    const dataLike = row.filter(c => parseDate(c) || /^[\d,.\s원₩-]+$/.test(c)).length;
    return hits >= 1 && hits >= dataLike;
  }

  /* ---------- 파일 ---------- */
  let xlsxLib = null;
  function loadXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (xlsxLib) return xlsxLib;
    xlsxLib = new Promise((ok, no) => {
      const s = document.createElement('script');
      s.src = 'vendor/xlsx/xlsx.full.min.js';
      s.onload = () => ok(window.XLSX); s.onerror = () => { xlsxLib = null; no(new Error('엑셀 읽기 도구를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.')); };
      document.head.append(s);
    });
    return xlsxLib;
  }
  async function readFile(file) {
    const name = file.name.toLowerCase();
    if (/\.(xlsx|xlsm|xls|ods)$/.test(name)) {
      const X = await loadXlsx();
      const wb = X.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      return wb.SheetNames.map(n => ({ name: n, rows: X.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' })
        .map(r => r.map(v => v instanceof Date ? v : String(v).trim())).filter(r => r.some(v => v !== '')) }));
    }
    const buf = await file.arrayBuffer();
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); }
    catch (e) { text = new TextDecoder('euc-kr').decode(buf); } // 한국어 엑셀이 저장한 CSV
    return [{ name: file.name, rows: parseText(text) }];
  }
  function csvOf(rows) {
    const esc = v => { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    return '﻿' + rows.map(r => r.map(esc).join(',')).join('\r\n');
  }
  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const a = h('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  const colName = i => { let s = ''; i++; while (i) { const r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); } return s; };

  /* ---------- 창 ---------- */
  function open(cfg) {
    const fields = cfg.fields;
    let rows = [], header = null, map = {}, sheets = null, result = null;
    const body = h('div', { class: 'stack', style: 'gap:14px' });
    const close = sheet(cfg.title + ' — 엑셀로 넣기·받기', body);
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': '넣기·받기' });
    let mode = 'in';
    const pane = h('div', { class: 'stack', style: 'gap:14px' });
    function drawSeg() { seg.replaceChildren(
      h('button', { type: 'button', 'aria-pressed': String(mode === 'in'), onclick: () => { mode = 'in'; drawSeg(); drawIn(); } }, '엑셀에서 넣기'),
      h('button', { type: 'button', 'aria-pressed': String(mode === 'out'), onclick: () => { mode = 'out'; drawSeg(); drawOut(); } }, '엑셀로 받기')); }
    body.append(seg, pane); drawSeg();

    function drawOut() {
      const items = cfg.store.items().filter(cfg.exportFilter || (() => true));
      const sorted = cfg.exportSort ? items.slice().sort(cfg.exportSort) : items;
      pane.replaceChildren(
        h('p', { class: 'muted', style: 'margin:0' }, '지금까지 적은 ' + cfg.title + ' 기록 ' + sorted.length + '개를 엑셀에서 열 수 있는 파일(CSV)로 내려받아요. 백업해 두거나, 엑셀에서 고친 뒤 다시 넣을 때 써요.'),
        h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', disabled: !sorted.length, onclick: () => {
          const ex = fields.filter(f => !f.noExport);
          const out = [ex.map(f => f.label)].concat(sorted.map(it => ex.map(f => f.out ? f.out(it) : (it[f.key] == null ? '' : it[f.key]))));
          download('생활노트_' + cfg.title + '_' + today() + '.csv', csvOf(out)); toast('파일을 내려받았어요');
        } }, '파일 내려받기')),
        h('p', { class: 'small muted', style: 'margin:0' }, '내려받은 파일은 엑셀에서 바로 열려요. 구글 시트는 "파일 → 가져오기 → 업로드"로 열면 돼요.'));
    }

    const ta = h('textarea', { class: 'xl-ta', placeholder: '여기를 누르고 붙여넣기 (Ctrl+V, 폰은 길게 눌러 "붙여넣기")', 'aria-label': '엑셀에서 복사한 내용' });
    const fileIn = h('input', { type: 'file', accept: '.xlsx,.xls,.xlsm,.ods,.csv,.tsv,.txt', hidden: true });
    const sheetSel = h('select', { 'aria-label': '시트 고르기', hidden: true });
    const mapBox = h('div', { class: 'stack', style: 'gap:10px' });
    let tmr;
    ta.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => setRows(parseText(ta.value)), 250); });
    fileIn.addEventListener('change', async () => {
      const f = fileIn.files[0]; if (!f) return;
      mapBox.replaceChildren(h('p', { class: 'muted' }, '파일을 읽는 중…'));
      try {
        sheets = await readFile(f); ta.value = '';
        sheetSel.replaceChildren(...sheets.map((s, i) => h('option', { value: i }, s.name + ' (' + s.rows.length + '줄)')));
        const best = sheets.reduce((b, s, i) => s.rows.length > sheets[b].rows.length ? i : b, 0);
        sheetSel.value = best; sheetSel.hidden = sheets.length < 2;
        setRows(sheets[best].rows);
        toast('"' + f.name + '" 파일을 읽었어요');
      } catch (e) { mapBox.replaceChildren(h('p', { class: 'note warn' }, (e && e.message) || '파일을 읽지 못했어요.')); }
      fileIn.value = '';
    });
    sheetSel.addEventListener('change', () => setRows(sheets[Number(sheetSel.value)].rows));

    function drawIn() {
      if (result) return drawDone();
      pane.replaceChildren(
        h('ol', { class: 'xl-steps' },
          h('li', {}, '엑셀이나 구글 시트에서 넣을 부분을 ', h('b', {}, '제목 줄까지 같이'), ' 마우스로 드래그해서 고르고 ', h('b', {}, 'Ctrl+C'), '(복사)를 눌러요.'),
          h('li', {}, '아래 네모 칸을 누르고 ', h('b', {}, 'Ctrl+V'), '(붙여넣기)를 눌러요.'),
          h('li', {}, '아래에 미리보기가 나오면 맞는지 보고 ', h('b', {}, '"넣기"'), '를 눌러요.')),
        h('div', { class: 'stack', style: 'gap:6px' }, h('span', { class: 'label' }, '이런 칸이 있으면 알아서 찾아요 (초록색은 꼭 있어야 하는 칸)'),
          h('div', { class: 'xl-cols' }, fields.filter(f => !f.noImport).map(f => h('span', { class: f.required ? 'req' : '' }, f.label)))),
        ta,
        h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' },
          h('button', { class: 'btn sm', type: 'button', onclick: () => fileIn.click() }, '엑셀 파일 고르기'),
          h('button', { class: 'btn sm ghost', type: 'button', onclick: () => {
            download('생활노트_' + cfg.title + '_양식.csv', csvOf([fields.filter(f => !f.noImport && !f.noExport).map(f => f.label)].concat(cfg.sample || [])));
            toast('양식을 내려받았어요. 엑셀에서 열어 채워 주세요.');
          } }, '빈 양식 받기'),
          fileIn, sheetSel),
        mapBox);
      if (rows.length) drawMap();
    }

    let fixed = {}; // 표에 없는 칸: 모든 줄에 똑같이 넣을 값
    function setRows(r) {
      rows = r || []; result = null;
      if (!rows.length) { header = null; map = {}; mapBox.replaceChildren(); return; }
      const inFields = fields.filter(f => !f.noImport);
      if (looksLikeHeader(rows[0], inFields)) { header = rows[0]; map = autoMap(header, inFields); }
      else { header = null; map = {}; inFields.filter(f => !f.noExport).forEach((f, i) => { if (i < rows[0].length) map[f.key] = i; }); }
      Object.keys(fixed).forEach(k => { if (map[k] != null) delete fixed[k]; });
      drawMap();
    }

    function convert() {
      const data = header ? rows.slice(1) : rows;
      const ok = [], errs = []; let dup = 0;
      const seen = new Set((cfg.dupKey ? cfg.store.items().map(cfg.dupKey) : []));
      data.forEach((r, n) => {
        const v = {}, bad = [];
        fields.forEach(f => {
          if (f.noImport) return;
          let raw;
          if (map[f.key] != null) raw = r[map[f.key]];
          else if (fixed[f.key] != null && fixed[f.key] !== '') raw = fixed[f.key];
          else return;
          const val = readCell(raw, f);
          if (val && val.bad) bad.push(f.label + ' (' + raw + ')'); else if (val !== undefined) v[f.key] = val;
        });
        const line = n + (header ? 2 : 1);
        if (bad.length) { errs.push(line + '번째 줄: ' + bad.join(', ') + ' 칸을 읽을 수 없어요'); return; }
        const item = cfg.toItem(v, r);
        if (!item || item.error) { errs.push(line + '번째 줄: ' + ((item && item.error) || '비어 있어요')); return; }
        if (cfg.dupKey) { const k = cfg.dupKey(item); if (seen.has(k)) { dup++; return; } seen.add(k); }
        ok.push(item);
      });
      return { ok, errs, dup };
    }

    // 직접 적는 칸 (날짜는 달력, 정해진 보기는 고르기, 나머지는 글자)
    function fixedInput(f) {
      const set = v => { fixed[f.key] = v; drawPreview(); };
      if (f.type === 'date') { const i = h('input', { type: 'date', value: fixed[f.key] || '' }); i.addEventListener('input', () => set(i.value)); return i; }
      if (f.type === 'choice' && !f.keepRaw) {
        const labels = f.fixedOptions || f.options.map(o => /^[a-z]+$/.test(o[0]) ? o[1] : o[0]);
        if (fixed[f.key] == null) fixed[f.key] = labels[0];
        const sl = h('select', {}, labels.map(l => h('option', { selected: l === fixed[f.key] }, l)));
        sl.addEventListener('change', () => set(sl.value)); return sl;
      }
      const id = 'xl-dl-' + f.key;
      const i = h('input', { type: 'text', value: fixed[f.key] || '', placeholder: f.type === 'choice' ? '예: ' + f.options[0][0] : f.type === 'amount' ? '예: 100000' : '모든 줄에 넣을 값', list: f.type === 'choice' ? id : null });
      i.addEventListener('input', () => set(i.value.trim()));
      return f.type === 'choice' ? h('div', { class: 'stack', style: 'gap:0' }, i, h('datalist', { id }, f.options.map(o => h('option', { value: o[0] })))) : i;
    }

    const prevBox = h('div', { class: 'stack', style: 'gap:10px' });
    function drawMap() {
      const width = Math.max(...rows.slice(0, 50).map(r => r.length));
      const colLabel = i => colName(i) + '열' + (header && header[i] ? ' · ' + header[i] : rows[0][i] ? ' · ' + String(rows[0][i] instanceof Date ? iso(rows[0][i]) : rows[0][i]).slice(0, 12) : '');
      const sel = fields.filter(f => !f.noImport).map(f => {
        const cur = map[f.key] != null ? String(map[f.key]) : (fixed[f.key] != null ? 'fix' : '');
        const s = h('select', { onchange: () => {
            delete map[f.key]; delete fixed[f.key];
            if (s.value === 'fix') fixed[f.key] = ''; else if (s.value !== '') map[f.key] = Number(s.value);
            drawMap();
          } },
          h('option', { value: '', selected: cur === '' }, '— 안 씀 —'),
          h('option', { value: 'fix', selected: cur === 'fix' }, '직접 적기'),
          Array.from({ length: width }, (_, i) => h('option', { value: i, selected: cur === String(i) }, colLabel(i))));
        return h('label', { class: cur === 'fix' ? 'fix' : '' }, h('span', {}, f.label + (f.required ? ' *' : '')), s, cur === 'fix' ? fixedInput(f) : null);
      });
      mapBox.replaceChildren(
        h('div', { class: 'stack', style: 'gap:6px' },
          h('span', { class: 'label' }, header ? '엑셀의 어느 열이 어떤 내용인지 맞춰봤어요. 틀리면 바꿔 주세요.' : '제목 줄이 없어서 왼쪽 열부터 차례로 맞췄어요. 틀리면 바꿔 주세요.'),
          h('p', { class: 'small muted', style: 'margin:0' }, '엑셀에 없는 칸은 "직접 적기"를 고르면 모든 줄에 같은 값을 넣을 수 있어요. 예) 결혼식 때 받은 축의금 명단이면 구분 → "내가 받음", 무슨 일 → "결혼", 날짜 → 결혼한 날.'),
          h('div', { class: 'xl-map' }, sel)),
        prevBox);
      drawPreview();
    }
    function drawPreview() {
      const { ok, errs, dup } = convert();
      const cols = cfg.preview;
      const btn = h('button', { class: 'btn primary', type: 'button', disabled: !ok.length, onclick: () => {
        btn.disabled = true;
        const imp = 'x' + Date.now().toString(36);
        const added = cfg.store.putMany(ok.map(it => Object.assign({}, it, { imp })));
        result = { ids: added.map(x => x.id), n: added.length };
        drawDone();
      } }, ok.length ? ok.length + '개 넣기' : '넣을 수 있는 줄이 없어요');
      prevBox.replaceChildren(...[
        ok.length ? h('div', { class: 'xl-prev' }, h('table', {},
          h('thead', {}, h('tr', {}, cols.map(c => h('th', {}, c[0])))),
          h('tbody', {}, ok.slice(0, 5).map(it => h('tr', {}, cols.map(c => h('td', {}, c[1](it)))))))) : null,
        h('div', { class: 'xl-sum' }, '넣을 수 있는 것 ' + ok.length + '개' + (ok.length > 5 ? ' (위에는 처음 5개만 보여요)' : '') +
          (dup ? ' · 이미 있는 ' + dup + '개는 건너뛰어요' : '') + (errs.length ? ' · 못 읽은 ' + errs.length + '줄' : '')),
        errs.length ? h('ul', { class: 'xl-err' }, errs.slice(0, 4).map(e => h('li', {}, e)), errs.length > 4 ? h('li', {}, '…외 ' + (errs.length - 4) + '줄') : null) : null,
        cfg.note ? h('p', { class: 'small muted', style: 'margin:0' }, cfg.note) : null,
        h('div', { class: 'row' }, btn)].filter(Boolean));
    }

    function drawDone() {
      pane.replaceChildren(
        h('div', { class: 'note' }, h('b', {}, result.n + '개를 넣었어요!'), ' 로그인해 있으면 다른 기기에도 곧 보여요.'),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', type: 'button', onclick: () => close() }, '닫기'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => {
            cfg.store.removeMany(result.ids); toast('방금 넣은 ' + result.n + '개를 지웠어요'); result = null; drawIn();
          } }, '잘못 넣었어요 (되돌리기)')));
    }
    drawIn();
  }

  /* ---------- 엑셀로 넣은 묶음 찾기·지우기 ---------- */
  function batches(store) {
    const g = {};
    store.items().forEach(x => {
      // imp 표시가 있으면 그 묶음, 없으면 예전 방식으로 한꺼번에 넣은 것(같은 시각에 2개 이상)
      const k = x.imp || ((x.createdAt || 0) > (x.updatedAt || 0) ? 'old' + x.updatedAt : null);
      if (!k) return;
      (g[k] = g[k] || []).push(x);
    });
    return Object.entries(g).filter(([k, l]) => !k.startsWith('old') || l.length >= 2)
      .map(([k, l]) => ({ key: k, items: l, at: Math.min(...l.map(x => x.imp ? parseInt(x.imp.slice(1), 36) : x.updatedAt)) }))
      .sort((a, b) => b.at - a.at);
  }
  const when = t => { const d = new Date(t); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  function openBatches(cfg) {
    const body = h('div', { class: 'stack', style: 'gap:12px' });
    const close = sheet('한꺼번에 넣은 기록 지우기', body);
    function draw() {
      const list = batches(cfg.store);
      if (!list.length) { body.replaceChildren(h('p', { class: 'muted', style: 'margin:0' }, '엑셀로 넣은 기록이 남아 있지 않아요.'), h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => close() }, '닫기'))); return; }
      body.replaceChildren(
        h('p', { class: 'muted', style: 'margin:0' }, '엑셀이나 카드 문자로 한꺼번에 넣은 것을 넣은 때마다 묶어서 보여줘요. 잘못 넣은 묶음을 통째로 지울 수 있어요. 직접 하나씩 적은 기록은 지워지지 않아요.'),
        h('ul', { class: 'list' }, list.map(b => {
          let armed = false;
          const del = h('button', { class: 'btn sm', type: 'button', onclick: () => {
            if (!armed) { armed = true; del.textContent = '한 번 더 누르면 ' + b.items.length + '개 삭제'; del.style.color = 'var(--danger)'; del.style.borderColor = 'var(--danger)'; return; }
            cfg.store.removeMany(b.items.map(x => x.id)); toast(b.items.length + '개를 지웠어요'); draw();
          } }, '모두 지우기');
          const col = cfg.preview.find(c => ['이름', '품목', '음식', '물건', '집안일', '운동', '내용'].includes(c[0])) || cfg.preview[0];
          const names = b.items.slice(0, 3).map(x => col[1](x)).filter(Boolean).join(', ');
          return h('li', {}, h('div', { class: 'grow' }, h('b', {}, when(b.at) + '에 넣은 ' + b.items.length + '개'), h('div', { class: 'tiny muted' }, names + (b.items.length > 3 ? ' 외' : ''))), del);
        })),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => close() }, '닫기')));
    }
    draw();
  }

  L.excel = function (cfg) {
    const head = document.querySelector('.page-head'); if (!head) return;
    const btn = h('button', { class: 'btn sm soft ln-xl', type: 'button', onclick: () => open(cfg) },
      '엑셀로 넣기·받기');
    const delBtn = h('button', { class: 'btn sm ghost', type: 'button', onclick: () => openBatches(cfg) }, '한꺼번에 넣은 것 지우기');
    const wrap = h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap;justify-self:start;margin-top:4px' }, btn, delBtn);
    head.append(wrap);
    const sync = () => { delBtn.hidden = !batches(cfg.store).length; };
    cfg.store.subscribe(sync); sync();
    return { open: () => open(cfg) };
  };
  L.excel._test = { parseText, parseDate, parseAmount, parseDays, parseChoice };
})();
