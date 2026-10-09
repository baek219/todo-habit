/* 생활노트 중간 서버 (Cloudflare Workers)
 *
 * 하는 일
 *  - 로그인 확인: 사이트에서 보낸 Firebase 로그인 확인증(토큰)이 진짜인지 검사
 *  - 하루 사용량 제한: 사람마다, 기능마다 하루에 쓸 수 있는 횟수를 정해 비용 폭탄을 막음
 *  - 비밀 열쇠(API 키)를 숨긴 채로 대신 물어봄
 *      POST /menu        → Claude에게 메뉴 추천
 *      GET  /places      → 카카오 지도에서 음식점 검색
 *      GET  /place       → 구글 지도에서 평점·후기·영업시간
 *      GET  /lotto/stats → 동행복권 당첨번호 통계
 *
 * Cloudflare에 넣어야 하는 설정 (설정 안내서 참고)
 *  비밀값(Secret): ANTHROPIC_API_KEY, KAKAO_REST_KEY, GOOGLE_PLACES_KEY
 *  변수(Variable): FIREBASE_PROJECT_ID (기본 checklist-3164e), ALLOWED_ORIGIN (기본 https://baek219.github.io)
 *                  CLAUDE_MODEL (기본 claude-opus-5), 각 기능 하루 제한 LIMIT_MENU / LIMIT_PLACES / LIMIT_GOOGLE / LIMIT_LOTTO
 *  KV 저장소 연결: 이름 LIFE_KV
 */
import Anthropic from '@anthropic-ai/sdk';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

const DEFAULT_LIMITS = { menu: 10, places: 150, google: 30, lotto: 60, geo: 200 };

/* ---------- 응답 도우미 ---------- */
function corsHeaders(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGIN || 'https://baek219.github.io').split(',').map(s => s.trim());
  const ok = allowed.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}
function json(req, env, data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(req, env) } });
}
function fail(req, env, status, error, message) { return json(req, env, { error, message }, status); }

/* ---------- 로그인 확인 ---------- */
async function verifyUser(req, env) {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  const pid = env.FIREBASE_PROJECT_ID || 'checklist-3164e';
  try {
    const { payload } = await jwtVerify(token, GOOGLE_JWKS, { issuer: 'https://securetoken.google.com/' + pid, audience: pid });
    return payload.sub ? { uid: payload.sub } : null;
  } catch (e) { return null; }
}

/* ---------- 하루 사용량 제한 ---------- */
function kstDate() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); }
function limitFor(env, kind) {
  const v = parseInt(env['LIMIT_' + kind.toUpperCase()], 10);
  return Number.isFinite(v) && v >= 0 ? v : DEFAULT_LIMITS[kind];
}
// 남은 횟수가 있으면 1 깎고 남은 수를 돌려줌, 없으면 -1
async function useQuota(env, kind, uid) {
  if (!env.LIFE_KV) return { ok: false, setup: true };
  const limit = limitFor(env, kind);
  const key = 'rl:' + kind + ':' + uid + ':' + kstDate();
  const used = parseInt(await env.LIFE_KV.get(key), 10) || 0;
  if (used >= limit) return { ok: false, remaining: 0, limit };
  await env.LIFE_KV.put(key, String(used + 1), { expirationTtl: 2 * 86400 });
  return { ok: true, remaining: limit - used - 1, limit };
}
function quotaFail(req, env, q, what) {
  if (q.setup) return fail(req, env, 503, 'server_setup', '서버에 KV 저장소(LIFE_KV)가 연결되지 않았어요.');
  return fail(req, env, 429, 'daily_limit', '오늘 ' + what + ' 사용 횟수(' + q.limit + '번)를 다 썼어요. 내일 다시 써 주세요.');
}

/* ---------- 메뉴 추천 (Claude) ---------- */
const MENU_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          menu: { type: 'string' },
          why: { type: 'string' },
          search: { type: 'string' },
          kind: { type: 'string' }
        },
        required: ['menu', 'why', 'search', 'kind'],
        additionalProperties: false
      }
    }
  },
  required: ['items'],
  additionalProperties: false
};
const clip = (s, n) => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').slice(0, n);

async function handleMenu(req, env, user) {
  if (!env.ANTHROPIC_API_KEY) return fail(req, env, 503, 'server_setup', 'AI 열쇠(ANTHROPIC_API_KEY)가 설정되지 않았어요.');
  let b; try { b = await req.json(); } catch (e) { return fail(req, env, 400, 'bad_request', '요청 형식이 잘못됐어요.'); }
  const q = await useQuota(env, 'menu', user.uid);
  if (!q.ok) return quotaFail(req, env, q, 'AI 추천');

  const list = v => (Array.isArray(v) ? v : []).map(x => clip(x, 30)).filter(Boolean).slice(0, 10);
  const prompt = [
    '한국에 사는 사람이 오늘 무엇을 먹을지 고르는 걸 도와줘.',
    '아래 조건을 보고, 한국 동네 식당이나 배달로 흔히 먹을 수 있는 메뉴(음식 종류) 3가지를 서로 겹치지 않게 추천해.',
    '',
    '조건',
    '- 끼니: ' + (clip(b.meal, 10) || '상관없음'),
    '- 누구랑: ' + (clip(b.with, 20) || '상관없음'),
    '- 기분·컨디션: ' + (list(b.moods).join(', ') || '상관없음'),
    '- 날씨: ' + (clip(b.weather, 10) || '상관없음'),
    '- 1인 예산: ' + (clip(b.budget, 20) || '상관없음'),
    '- 먹는 방법: ' + (clip(b.how, 20) || '상관없음'),
    '- 빼고 싶은 것: ' + (clip(b.avoid, 80) || '없음'),
    '- 최근에 먹어서 피할 메뉴: ' + (list(b.recent).join(', ') || '없음'),
    '',
    '규칙',
    '- 가게 이름은 절대 지어내지 말고 메뉴 이름만 써.',
    '- why: 이 조건에 왜 맞는지 존댓말 한 문장 (40자 안팎).',
    '- search: 지도에서 찾을 때 쓸 짧은 검색어 (예: 김치찌개, 마라탕).',
    '- kind: 한식/중식/일식/양식/분식/아시안/고기/카페·디저트 중 하나.'
  ].join('\n');

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const model = env.CLAUDE_MODEL || 'claude-opus-5';
  const params = {
    model,
    max_tokens: 4000,
    output_config: { format: { type: 'json_schema', schema: MENU_SCHEMA } },
    messages: [{ role: 'user', content: prompt }]
  };
  // 생각하는 양을 줄여 빠르고 싸게 (Haiku 모델은 이 설정을 받지 않음)
  if (!/haiku/.test(model)) params.output_config.effort = 'low';
  // Opus 5 / Fable: 안전 검사로 거절되면 다른 모델이 대신 답하게 함
  if (/^claude-(opus-5|fable-5)/.test(model)) { params.betas = ['server-side-fallback-2026-07-01']; params.fallbacks = 'default'; }
  let res;
  try {
    res = await client.beta.messages.create(params);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return fail(req, env, 503, 'ai_busy', 'AI가 잠시 바빠요. 조금 뒤에 다시 눌러 주세요.');
    if (e instanceof Anthropic.AuthenticationError) return fail(req, env, 503, 'server_setup', 'AI 열쇠가 잘못됐어요. 서버 설정을 확인해 주세요.');
    if (e instanceof Anthropic.APIError) return fail(req, env, 502, 'ai_error', 'AI 응답에 문제가 생겼어요. (' + e.status + ')');
    return fail(req, env, 502, 'ai_error', 'AI에 연결하지 못했어요.');
  }
  if (res.stop_reason === 'refusal') return fail(req, env, 422, 'ai_refused', '이 조건으로는 추천을 받지 못했어요. 조건을 바꿔 보세요.');
  const textBlock = res.content.find(c => c.type === 'text');
  let items = [];
  try { items = JSON.parse(textBlock ? textBlock.text : '{}').items || []; } catch (e) { items = []; }
  items = items.slice(0, 3).map(it => ({ menu: clip(it.menu, 30), why: clip(it.why, 120), search: clip(it.search, 30), kind: clip(it.kind, 12) }));
  if (!items.length) return fail(req, env, 502, 'ai_error', '추천 결과를 읽지 못했어요. 다시 눌러 주세요.');
  return json(req, env, { items, remaining: q.remaining, limit: q.limit });
}

/* ---------- 카카오 음식점 검색 ---------- */
async function handlePlaces(req, env, user, url) {
  if (!env.KAKAO_REST_KEY) return fail(req, env, 503, 'server_setup', '카카오 열쇠(KAKAO_REST_KEY)가 설정되지 않았어요.');
  const query = clip(url.searchParams.get('q'), 60).trim();
  if (!query) return fail(req, env, 400, 'bad_request', '검색어를 넣어 주세요.');
  const q = await useQuota(env, 'places', user.uid);
  if (!q.ok) return quotaFail(req, env, q, '맛집 검색');

  const k = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
  k.searchParams.set('query', query);
  const cat = url.searchParams.get('cat') === 'cafe' ? 'CE7' : url.searchParams.get('cat') === 'all' ? '' : 'FD6';
  if (cat) k.searchParams.set('category_group_code', cat);
  const x = parseFloat(url.searchParams.get('x')), y = parseFloat(url.searchParams.get('y'));
  if (Number.isFinite(x) && Number.isFinite(y)) {
    k.searchParams.set('x', String(x)); k.searchParams.set('y', String(y));
    k.searchParams.set('radius', String(Math.min(20000, Math.max(100, parseInt(url.searchParams.get('radius'), 10) || 2000))));
    k.searchParams.set('sort', url.searchParams.get('sort') === 'accuracy' ? 'accuracy' : 'distance');
  }
  k.searchParams.set('page', String(Math.min(45, Math.max(1, parseInt(url.searchParams.get('page'), 10) || 1))));
  k.searchParams.set('size', '15');
  let r;
  try { r = await fetch(k, { headers: { Authorization: 'KakaoAK ' + env.KAKAO_REST_KEY } }); }
  catch (e) { return fail(req, env, 502, 'kakao_error', '카카오 지도에 연결하지 못했어요.'); }
  if (r.status === 401 || r.status === 403) return fail(req, env, 503, 'server_setup', '카카오 열쇠가 잘못됐거나 사용 설정이 꺼져 있어요.');
  if (!r.ok) return fail(req, env, 502, 'kakao_error', '카카오 지도 검색에 실패했어요. (' + r.status + ')');
  const d = await r.json();
  const places = (d.documents || []).map(p => ({
    id: p.id, name: p.place_name, category: (p.category_name || '').split(' > ').slice(1).join(' > '),
    phone: p.phone, address: p.road_address_name || p.address_name, x: p.x, y: p.y,
    distance: p.distance ? Number(p.distance) : null, kakaoUrl: p.place_url
  }));
  return json(req, env, { places, isEnd: !!(d.meta && d.meta.is_end), total: d.meta ? d.meta.pageable_count : places.length, remaining: q.remaining });
}

/* ---------- 동네 이름 찾기 / 현재 위치 이름 (카카오) ---------- */
async function kakao(env, path, params) {
  const u = new URL('https://dapi.kakao.com' + path);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u, { headers: { Authorization: 'KakaoAK ' + env.KAKAO_REST_KEY } });
  if (!r.ok) throw new Error('kakao ' + r.status);
  return r.json();
}
function splitName(full) {
  const parts = String(full || '').trim().split(/\s+/);
  return { name: parts[parts.length - 1] || full, sub: parts.slice(0, -1).join(' ') };
}
async function handleGeoSearch(req, env, user, url) {
  if (!env.KAKAO_REST_KEY) return fail(req, env, 503, 'server_setup', '카카오 열쇠(KAKAO_REST_KEY)가 설정되지 않았어요.');
  const q = clip(url.searchParams.get('q'), 40).trim();
  if (!q) return fail(req, env, 400, 'bad_request', '지역 이름을 넣어 주세요.');
  const quota = await useQuota(env, 'geo', user.uid);
  if (!quota.ok) return quotaFail(req, env, quota, '지역 찾기');
  const out = [], seen = new Set();
  const add = (name, sub, x, y) => {
    const key = (sub + ' ' + name).trim();
    if (!name || seen.has(key)) return; seen.add(key);
    out.push({ name, sub, lat: Math.round(Number(y) * 1000) / 1000, lon: Math.round(Number(x) * 1000) / 1000 });
  };
  try {
    // 1) 주소(시·구·동) 이름으로
    const a = await kakao(env, '/v2/local/search/address.json', { query: q, size: '10' });
    (a.documents || []).forEach(d => { const n = splitName(d.address_name); add(n.name, n.sub, d.x, d.y); });
    // 2) 결과가 적으면 장소 이름(역·건물 등)으로도
    if (out.length < 3) {
      const k = await kakao(env, '/v2/local/search/keyword.json', { query: q, size: '8' });
      (k.documents || []).forEach(d => add(d.place_name, d.address_name, d.x, d.y));
    }
  } catch (e) { return fail(req, env, 502, 'kakao_error', '카카오 지도에서 지역을 찾지 못했어요.'); }
  return json(req, env, { places: out.slice(0, 10) });
}
async function handleGeoReverse(req, env, user, url) {
  if (!env.KAKAO_REST_KEY) return fail(req, env, 503, 'server_setup', '카카오 열쇠(KAKAO_REST_KEY)가 설정되지 않았어요.');
  const x = parseFloat(url.searchParams.get('x')), y = parseFloat(url.searchParams.get('y'));
  if (!Number.isFinite(x) || !Number.isFinite(y)) return fail(req, env, 400, 'bad_request', '위치가 필요해요.');
  const quota = await useQuota(env, 'geo', user.uid);
  if (!quota.ok) return quotaFail(req, env, quota, '지역 찾기');
  try {
    const d = await kakao(env, '/v2/local/geo/coord2regioncode.json', { x: String(x), y: String(y) });
    const docs = d.documents || [];
    const r = docs.find(v => v.region_type === 'H') || docs[0];
    if (!r) return json(req, env, { found: false });
    const name = r.region_3depth_name || r.region_2depth_name || r.region_1depth_name;
    const sub = [r.region_1depth_name, r.region_2depth_name].filter(Boolean).join(' ');
    return json(req, env, { found: true, name, sub });
  } catch (e) { return fail(req, env, 502, 'kakao_error', '현재 위치 이름을 찾지 못했어요.'); }
}

/* ---------- 구글 평점·후기 ---------- */
async function handlePlace(req, env, user, url) {
  if (!env.GOOGLE_PLACES_KEY) return fail(req, env, 503, 'server_setup', '구글 열쇠(GOOGLE_PLACES_KEY)가 설정되지 않았어요.');
  const name = clip(url.searchParams.get('name'), 60).trim();
  const x = parseFloat(url.searchParams.get('x')), y = parseFloat(url.searchParams.get('y'));
  if (!name || !Number.isFinite(x) || !Number.isFinite(y)) return fail(req, env, 400, 'bad_request', '가게 이름과 위치가 필요해요.');
  const q = await useQuota(env, 'google', user.uid);
  if (!q.ok) return quotaFail(req, env, q, '구글 후기 보기');

  let r;
  try { r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': env.GOOGLE_PLACES_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.regularOpeningHours.weekdayDescriptions,places.currentOpeningHours.openNow,places.reviews,places.googleMapsUri'
    },
    body: JSON.stringify({ textQuery: name, languageCode: 'ko', regionCode: 'KR', pageSize: 1,
      locationBias: { circle: { center: { latitude: y, longitude: x }, radius: 300 } } })
  }); } catch (e) { return fail(req, env, 502, 'google_error', '구글 지도에 연결하지 못했어요.'); }
  if (r.status === 403) return fail(req, env, 503, 'server_setup', '구글 열쇠가 잘못됐거나 Places API가 켜져 있지 않아요.');
  if (!r.ok) return fail(req, env, 502, 'google_error', '구글 정보를 가져오지 못했어요. (' + r.status + ')');
  const d = await r.json();
  const p = (d.places || [])[0];
  if (!p) return json(req, env, { found: false, remaining: q.remaining });
  const PRICE = { PRICE_LEVEL_FREE: '무료', PRICE_LEVEL_INEXPENSIVE: '저렴', PRICE_LEVEL_MODERATE: '보통', PRICE_LEVEL_EXPENSIVE: '비쌈', PRICE_LEVEL_VERY_EXPENSIVE: '매우 비쌈' };
  return json(req, env, {
    found: true,
    name: p.displayName && p.displayName.text, address: p.formattedAddress,
    rating: p.rating || null, ratingCount: p.userRatingCount || 0, price: PRICE[p.priceLevel] || null,
    openNow: p.currentOpeningHours ? p.currentOpeningHours.openNow : null,
    hours: (p.regularOpeningHours && p.regularOpeningHours.weekdayDescriptions) || [],
    reviews: (p.reviews || []).slice(0, 5).map(v => ({
      rating: v.rating, when: v.relativePublishTimeDescription,
      text: clip(v.text && v.text.text || (v.originalText && v.originalText.text) || '', 400),
      author: v.authorAttribution && v.authorAttribution.displayName, authorUrl: v.authorAttribution && v.authorAttribution.uri
    })),
    googleUrl: p.googleMapsUri, remaining: q.remaining
  });
}

/* ---------- 로또 통계 (동행복권) ---------- */
// 당첨번호는 바뀌지 않으므로 서버(KV)에 모아두고, 부를 때마다 아직 없는 회차를 최대 40개씩 더 가져와요.
async function fetchDraw(n) {
  const r = await fetch('https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=' + n, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } });
  if (!r.ok) throw new Error('http ' + r.status);
  const t = await r.text();
  let d; try { d = JSON.parse(t); } catch (e) { throw new Error('blocked'); }
  if (d.returnValue !== 'success') return null;
  return { r: d.drwNo, d: d.drwNoDate, n: [d.drwtNo1, d.drwtNo2, d.drwtNo3, d.drwtNo4, d.drwtNo5, d.drwtNo6], b: d.bnusNo };
}
async function handleLotto(req, env, user) {
  if (!env.LIFE_KV) return fail(req, env, 503, 'server_setup', '서버에 KV 저장소(LIFE_KV)가 연결되지 않았어요.');
  const q = await useQuota(env, 'lotto', user.uid);
  if (!q.ok) return quotaFail(req, env, q, '로또 통계');
  let st = await env.LIFE_KV.get('lotto:stats', 'json');
  if (!st) st = { last: 0, counts: Array(46).fill(0), bonus: Array(46).fill(0), recent: [], checkedAt: 0 };
  let added = 0, blocked = false, done = false;
  const freshEnough = Date.now() - (st.checkedAt || 0) < 6 * 3600000 && st.last > 0;
  if (!freshEnough) {
    for (let i = 0; i < 40; i++) {
      let d;
      try { d = await fetchDraw(st.last + 1); } catch (e) { blocked = true; break; }
      if (!d) { done = true; break; }
      st.last = d.r; d.n.forEach(x => st.counts[x]++); st.bonus[d.b]++;
      st.recent.unshift(d); st.recent = st.recent.slice(0, 10); added++;
    }
    if (done) st.checkedAt = Date.now();
    if (added || done) await env.LIFE_KV.put('lotto:stats', JSON.stringify(st));
  }
  return json(req, env, { last: st.last, counts: st.counts, recent: st.recent, complete: freshEnough || done, blocked, remaining: q.remaining });
}

/* ---------- 입구 ---------- */
export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req, env) });
    const url = new URL(req.url);
    if (url.pathname === '/' || url.pathname === '/health') return json(req, env, { ok: true, name: 'life-note' });
    const user = await verifyUser(req, env);
    if (!user) return fail(req, env, 401, 'login', 'Google 로그인이 필요해요. 다시 로그인해 주세요.');
    try {
      if (url.pathname === '/menu' && req.method === 'POST') return await handleMenu(req, env, user);
      if (url.pathname === '/places' && req.method === 'GET') return await handlePlaces(req, env, user, url);
      if (url.pathname === '/place' && req.method === 'GET') return await handlePlace(req, env, user, url);
      if (url.pathname === '/lotto/stats' && req.method === 'GET') return await handleLotto(req, env, user);
      if (url.pathname === '/geo/search' && req.method === 'GET') return await handleGeoSearch(req, env, user, url);
      if (url.pathname === '/geo/reverse' && req.method === 'GET') return await handleGeoReverse(req, env, user, url);
      return fail(req, env, 404, 'not_found', '없는 주소예요.');
    } catch (e) {
      return fail(req, env, 500, 'server_error', '서버에서 문제가 생겼어요.');
    }
  }
};
