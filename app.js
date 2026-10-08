/* Haemun storefront — vanilla JS rewrite of the DCLogic prototype. */
const PREFIX = { SGD: 'S$ ', USD: 'US$ ', KRW: '₩' };
const sgd = (n) => (PREFIX[STORE_CURRENCY] || STORE_CURRENCY + ' ') + n.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dotHtml = (c) => `<span class="dot" style="background:${c}"></span>`;
const region = (o) => o.split(',')[0];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const state = {
  lang: 'en', b2b: false, view: 'home', cat: 'all', origin: 'all', sort: 'new', shopQ: '', f: { price: 'all', coll: 'all', stock: false }, filterOpen: false, fDraft: null, fSec: 'cat',
  jcat: 'all', postId: null, cart: loadCart(), cartOpen: false, activeId: null, tab: 'form', qty: 1, photoIdx: 0,
  loading: !!WC_STORE_API,
};

function loadCart() { try { return JSON.parse(localStorage.getItem('hm-cart')) || {}; } catch (e) { return {}; } }
function saveCart() { try { localStorage.setItem('hm-cart', JSON.stringify(state.cart)); } catch (e) {} }
const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
const catCount = (c) => (state.loading ? '' : String(PRODUCTS.filter((p) => p.cat === c).length).padStart(2, '0') + ' →');
// Image for a journal story: its WordPress featured image if it has one,
// otherwise the linked product's picture or drawn illustration.
const postLook = (j) => (j.image ? { photo: j.image, name: j.title.en, bg: '#E2E1DD' } : (j.product && findProduct(j.product)) || { bg: '#E2E1DD' });
// Volume shows curated picks; with a live store that has none tagged
// "volume" yet, fall back to the newest six so the section is never empty.
const volumePicks = () => {
  const v = PRODUCTS.filter((p) => p.vol);
  return (v.length ? v : PRODUCTS.slice(0, 6)).slice().sort((x, y) => CATS.indexOf(x.cat) - CATS.indexOf(y.cat) || y.price - x.price);
};

// Hash routes so Back/Forward and refresh keep the reader where they were.
function toHash() {
  const base = pageHash();
  return state.activeId ? base + '?p=' + encodeURIComponent(state.activeId) : base;
}
function pageHash() {
  if (state.view === 'mall') return state.cat === 'all' ? '#/shop' : '#/shop/' + state.cat;
  if (state.view === 'journal') return '#/editorial';
  if (state.view === 'article') return '#/editorial/' + state.postId;
  if (state.view === 'about') return '#/about';
  if (state.view === 'drop') return '#/volume/' + VOLUME.no;
  if (state.view === 'drops') return '#/volumes';
  if (state.view === 'trade') return '#/trade';
  if (state.view === 'tradeorders') return '#/trade/orders';
  if (state.view === 'brands') return '#/brands';
  if (state.view === 'brand') return '#/brands/' + state.brand;
  return '#/';
}
function fromHash() {
  const [path, query] = (location.hash || '#/').replace(/^#/, '').split('?');
  const pid = new URLSearchParams(query || '').get('p');
  const product = { activeId: pid || null, qty: 1, tab: 'form', photoIdx: 0 };
  const [, a, b] = path.split('/');
  if (a === 'shop') return { view: 'mall', cat: CATS.includes(b) ? b : 'all', ...product };
  if (a === 'journal' || a === 'editorial') return b ? { view: 'article', postId: b, ...product } : { view: 'journal', postId: null, ...product };
  if (a === 'about') return { view: 'about', ...product };
  if (a === 'volume') return { view: 'drop', ...product };
  if (a === 'volumes') return { view: 'drops', ...product };
  if (a === 'trade') return { view: b === 'orders' ? 'tradeorders' : 'trade', ...product };
  if (a === 'brands') return b ? { view: 'brand', brand: b, ...product } : { view: 'brands', ...product };
  return { view: 'home', ...product };
}
let productPushed = false;
let afterPop = null;
function openProduct(id, extra = {}) {
  const wasOpen = !!state.activeId;
  setState({ activeId: id, qty: 1, tab: 'form', photoIdx: 0, searchOpen: false, cartOpen: false, ...extra });
  if (wasOpen) history.replaceState(null, '', toHash());
  else { history.pushState(null, '', toHash()); productPushed = true; }
}
function closeProduct(then) {
  if (productPushed) { productPushed = false; afterPop = then || null; history.back(); return; }
  setState({ activeId: null, ...(then || {}) });
  history.replaceState(null, '', toHash());
}

function setState(patch) { Object.assign(state, patch); render(); }
function addToCart(id, n) {
  const c = { ...state.cart };
  c[id] = Math.max(0, (c[id] || 0) + n);
  if (!c[id]) delete c[id];
  state.cart = c; saveCart();
  if (n > 0) { state.bump = true; setTimeout(() => { state.bump = false; }, 700); }
  setState({});
}
function go(patch) {
  productPushed = false;
  setState({ activeId: null, cartOpen: false, searchOpen: false, ...patch });
  const h = toHash();
  if (location.hash !== h) history.pushState(null, '', h);
  window.scrollTo(0, 0);
}
window.addEventListener('popstate', () => {
  const next = fromHash();
  const samePage = next.view === state.view && next.cat === state.cat && next.postId === state.postId;
  productPushed = false;
  setState({ cartOpen: false, searchOpen: false, ...next, ...(afterPop || {}) });
  afterPop = null;
  if (!samePage) window.scrollTo(0, 0);
});
function stepPhoto(d) {
  const raw = findProduct(state.activeId); const n = raw && raw.gallery ? raw.gallery.length : 0;
  if (n > 1) setState({ photoIdx: (state.photoIdx + d + n) % n });
}
document.addEventListener('keydown', (e) => {
  if (state.activeId && !state.searchOpen && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { stepPhoto(e.key === 'ArrowLeft' ? -1 : 1); return; }
  if (e.key === '/' && !state.searchOpen && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); return; }
  if (e.key === 'Enter' && state.searchOpen) { const first = document.querySelector('#search-results [data-action="openProduct"]'); if (first) first.click(); return; }
  if (e.key !== 'Escape') return;
  if (state.searchOpen) setState({ searchOpen: false });
  else if (state.activeId) closeProduct();
  else if (state.cartOpen) setState({ cartOpen: false });
  else if (state.filterOpen) setState({ filterOpen: false, fDraft: null });
});
document.addEventListener('change', (e) => {
  const k = e.target.dataset && e.target.dataset.change;
  const fd = e.target.dataset && e.target.dataset.fd;
  if (fd) { const v = fd === 'stock' ? e.target.checked : e.target.value; setState({ fDraft: { ...state.fDraft, [fd]: v } }); return; }
  if (k === 'origin') setState({ origin: e.target.value });
  else if (k === 'sort') setState({ sort: e.target.value });
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'shop-q') {
    state.shopQ = e.target.value;
    const t = T[state.lang], list = shopSort(shopFilter(state.cat, state.f, state.shopQ, state.origin));
    document.getElementById('shop-results').innerHTML = shopGridHtml(t, list);
    document.getElementById('shop-count').textContent = t.results(list.length);
    return;
  }
  if (e.target.id !== 'search-input') return;
  state.q = e.target.value;
  document.getElementById('search-results').innerHTML = searchResults(T[state.lang]);
});
function openSearch() {
  setState({ searchOpen: true, cartOpen: false });
  const i = document.getElementById('search-input');
  if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
}
const norm = (x) => String(x || '').toLowerCase();
function searchResults(t) {
  const q = norm(state.q).trim();
  if (!q) return `<div class="s-cats">${CATS.map((c) => `<button class="s-chip" data-action="goCat" data-cat="${c}">${dotHtml(CAT_COLOR[c])}${t.cats[c]}</button>`).join('')}</div>`;
  const words = q.split(/\s+/);
  const hits = PRODUCTS.filter((p) => { const hay = norm([p.name, p.ko, p.origin, p.teaser, T.en.cats[p.cat], T.ko.cats[p.cat]].join(' ')); return words.every((w) => hay.includes(w)); }).slice(0, 8);
  if (!hits.length) return `<p class="s-none">${t.noResults}</p>`;
  return hits.map((p) => `<button class="s-row" data-action="openProduct" data-id="${p.id}">
    <span class="s-img" style="background:${p.bg}">${mediaHtml(p, false)}</span>
    <span class="s-name">${esc(p.name)}<span class="muted">${t.cats[p.cat]}${p.origin ? ' · ' + esc(p.origin) : ''}</span></span>
    <span class="s-price">${viewOf(p, t).priceLabel}</span></button>`).join('');
}
function searchHtml(t) {
  return `<div class="search-layer" role="dialog" aria-modal="true" aria-label="${t.search}">
    <button class="search-scrim" data-action="closeSearch" aria-label="${t.close}"></button>
    <div class="search-panel">
      <div class="search-bar">
        <input id="search-input" type="search" autocomplete="off" placeholder="${t.searchPh}" value="${esc(state.q || '')}" aria-label="${t.search}">
        <button class="tlink" data-action="closeSearch">${t.close} ✕</button>
      </div>
      <div id="search-results" class="search-results">${searchResults(t)}</div>
    </div>
  </div>`;
}

function mediaHtml(p, label = true) {
  if (p.photo) return `<img src="${esc(p.photo)}" alt="${esc(p.name || '')}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block">`;
  return '';
}

function viewOf(p, t) {
  const svc = !!p.service, tiersOk = state.b2b && !svc;
  const price = tiersOk ? p.price * 0.55 : p.price;
  const idx = PRODUCTS.indexOf(p);
  return {
    ...p, no: 'HM / ' + String(idx + 1).padStart(3, '0'), tag: p.vol ? 'VOL.01' : '',
    priceLabel: (svc ? t.from + ' ' : '') + sgd(price),
    priceNote: svc ? t.perPerson : tiersOk ? t.wsp : t.rrp,
    catLabel: t.cats[p.cat], dotColor: CAT_COLOR[p.cat], showTiers: tiersOk, hasQty: !svc,
    quickLabel: svc ? t.enquire + ' →' : state.b2b ? t.inquire + ' →' : t.add,
    tiers: [
      { range: p.moq + '–' + (p.moq * 4 - 1), price: sgd(p.price * 0.55) },
      { range: p.moq * 4 + '–' + (p.moq * 10 - 1), price: sgd(p.price * 0.5) },
      { range: p.moq * 10 + '+', price: sgd(p.price * 0.45) },
    ],
  };
}

function cardHtml(p, t, h, opts = {}) {
  const v = viewOf(p, t);
  const num = opts.number === false ? '' : `<span class="cap ov-tl">${v.no}</span>`;
  const b2bBlock = opts.b2b === false ? '' : v.showTiers ? `
    <div class="tiers">
      <div class="tier-row"><span class="muted">MOQ</span><span>${v.moq}</span></div>
      ${v.tiers.map((tr) => `<div class="tier-row"><span class="muted">${tr.range}</span><span>${tr.price}</span></div>`).join('')}
      <button class="link-btn cap" data-action="openProduct" data-id="${p.id}">${t.dossier} ↓</button>
    </div>` : '';
  return `<article class="p-card">
    <button class="p-img" style="aspect-ratio:${h >= 560 ? '4 / 5' : '3 / 4'};background:${p.bg}" aria-label="${esc(p.name)}" data-action="openProduct" data-id="${p.id}">
      ${mediaHtml(p)}
      ${num}
      <span class="cap ov-tr">${v.tag}</span>
      <span class="p-alt">${esc(p.teaser)}</span>
    </button>
    <div class="p-info">
      <span class="p-name">${esc(p.name)}</span><span class="p-price">${v.priceLabel}</span>
      <span class="muted">${esc(p.ko)}</span><span class="muted small right">${v.priceNote}</span>
      <span class="p-meta">${dotHtml(v.dotColor)}${v.catLabel}${p.origin ? ' · ' + esc(p.origin) : ''}</span>
      <button class="link-btn small" data-action="quick" data-id="${p.id}">${v.quickLabel}</button>
    </div>
    ${b2bBlock}
  </article>`;
}

function sechead(n, title, sub, btnAction, btnLabel) {
  const btn = btnAction ? `<button class="link-btn head-btn" data-action="${btnAction}">${btnLabel} →</button>` : '<span class="head-btn"></span>';
  return `<div class="sec-head">
    <span class="sec-no">${n}</span>
    <span class="sec-title">${title}</span>
    <span class="sec-sub">${sub}</span>
    ${btn}
  </div>`;
}

function header(t) {
  const nav = (view, label) => `<button class="tlink" data-action="nav" data-view="${view}" style="${navStyle(view)}">${label}</button>`;
  return `
  <div class="cap annbar"><span>${t.ann1}</span><span class="sep">·</span><span>${t.ann2}</span></div>
  <header class="site-header${filmHeader() ? ' on-film' : ''}">
    <nav class="hnav">
      <button class="tlink nav-vol" data-action="nav" data-view="drop" style="${navStyle('drop')}">${t.volume}<span class="stamp stamp-sm">${t.now}</span></button>${nav('mall', t.shopAll)}${nav('brands', t.brands)}${nav('journal', t.journal)}${nav('about', t.about)}
    </nav>
    <button class="logo" data-action="nav" data-view="home">
      <img class="logo-mark logo-seal" src="assets/logo/haemun-badge.svg" alt="" width="40" height="40"><img class="logo-word on-light" src="assets/logo/haemun-wordmark.svg" alt="Haemun" width="92" height="16"><img class="logo-word on-dark" src="assets/logo/haemun-wordmark-white.svg" alt="" width="92" height="16">
    </button>
    <div class="htools">
      <button class="tlink" data-action="nav" data-view="trade" style="${navStyle('trade')}">${t.trade}</button>
      <span class="lang"><button class="tlink" data-action="setLang" data-lang="en" style="${navStyle(state.lang === 'en' ? '__lang' : '')}">EN</button><span class="sep">/</span><button class="tlink" data-action="setLang" data-lang="ko" style="${navStyle(state.lang === 'ko' ? '__lang' : '')}">한</button></span>
      <button class="tlink" data-action="openSearch" aria-label="${t.search}"><svg class="ico" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M13 13l5 5" stroke="currentColor" stroke-width="1.4"/></svg><span class="s-label">${t.search}</span></button>
      <button class="tlink bagbtn" data-action="openCart">${t.bag} <span class="bagcount${state.bump ? ' bump' : ''}">${cartCount()}</span></button>
    </div>
  </header>
  ${state.b2b ? `<div class="tradebar"><span>${t.tradeNote}</span><span class="muted2">FOB INCHEON · DDP SINGAPORE</span></div>` : ''}`;
}
function navStyle(view) {
  const active = view === state.view || (view === 'brands' && state.view === 'brand') || (view === 'trade' && state.view === 'tradeorders') || view === '__b2b' && state.b2b || view === '__lang';
  return active ? 'color:#0B0B0C;text-decoration:underline;text-underline-offset:8px' : 'color:#7A7A78';
}
function cartCount() { return Object.keys(state.cart).filter(findProduct).reduce((a, id) => a + state.cart[id], 0); }
// Same-category products first, then the rest; never items already excluded.
function suggest(base, exclude, n) {
  const pool = PRODUCTS.filter((p) => !exclude.includes(p.id));
  return pool.filter((p) => p.cat === base.cat).concat(pool.filter((p) => p.cat !== base.cat)).slice(0, n);
}
function miniCard(p, t) {
  return `<button class="mini" data-action="openProduct" data-id="${p.id}">
    <span class="mini-img" style="background:${p.bg}">${mediaHtml(p, false)}</span>
    <span class="mini-name">${esc(p.name)}</span><span class="muted">${viewOf(p, t).priceLabel}</span>
  </button>`;
}
// Next drop = the next month listed in DROP_MONTHS (data.js). Volume
// numbers count every drop since Volume 01.
function nextDropInfo(now = new Date()) {
  let next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  while (!DROP_MONTHS.includes(next.getMonth())) next = new Date(next.getFullYear(), next.getMonth() + 1, 1);
  let vol = 0;
  for (let d = new Date(VOL1.year, VOL1.month, 1); d <= next; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) if (DROP_MONTHS.includes(d.getMonth())) vol++;
  const days = Math.ceil((next - now) / 86400000);
  return { vol: String(vol).padStart(2, '0'), next, days };
}
function dropsHtml(t) {
  const si = seasonInfo();
  const notes = POSTS.find((j) => j.cat === 'house');
  const loc = state.lang === 'ko' ? 'ko-KR' : 'en-SG';
  // The next four volumes, starting with the one that is open now.
  const steps = [];
  let n = Number(si.curVol);
  for (let m = new Date(si.open); steps.length < 4; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
    if (!DROP_MONTHS.includes(m.getMonth())) continue;
    steps.push({ n: String(n++).padStart(2, '0'), m, status: steps.length === 0 ? 'open' : steps.length === 1 ? 'next' : 'later' });
  }
  const cards = steps.map((v) => {
    const label = { open: t.dwOpen, next: t.dwNext, later: t.dwLater }[v.status];
    const when = v.m.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' });
    return `<li class="dv dv-${v.status}">
      <span class="dv-dot"></span>
      <span class="dv-no">${v.n}</span>
      <span class="dv-name">${t.volumeN(v.n)}</span>
      <span class="dv-season">${DROP_MONTHS.length === 12 ? '' : t.seasons[v.m.getMonth()]}</span>
      <span class="dv-when cap">${v.status === 'open' ? t.dwOpenedOn : t.dwOpens} ${when}</span>
      <span class="dv-status cap">${v.status === 'open' ? `<span class="stamp">${label}</span>` : label}</span>
    </li>`;
  }).join('');
  const dates = DROP_MONTHS.map((m) => new Date(2026, m, 1).toLocaleDateString(loc, { day: 'numeric', month: 'long' }));
  const dateList = state.lang === 'ko' ? dates.join(', ') : dates.slice(0, -1).join(', ') + ' and ' + dates[dates.length - 1];
  return `<div class="dw">
    <div class="dw-intro">
      <div class="cap dw-kicker">${t.dwKicker}</div>
      <p class="dw-lead">${esc(t.dwLead)}</p>
    </div>
    <div class="dw-ideas">${t.dwIdeas.map(([h, b], i) => `<div class="dw-idea"><span class="dl-n mono small">${String(i + 1).padStart(2, '0')}</span><h3>${h}</h3><p>${b}</p></div>`).join('')}</div>
    <div class="dw-block">
      <div class="dw-bh"><span class="cap">${t.dwCal}</span></div>
      <ol class="dvols">${cards}</ol>
    </div>
    <div class="dw-dark">
      <div class="dw-bh dw-bh-dark"><span class="cap">${t.dwLife}</span><span class="dw-sub">${t.dwLifeSub}</span></div>
      <ol class="dlife">${t.dwSteps.map(([h, b], i) => `<li><span class="dl-n mono small">${String(i + 1).padStart(2, '0')}</span><span class="dl-h">${h}</span><p>${b}</p></li>`).join('')}</ol>
    </div>
    <div class="dw-block">
      <div class="dw-bh"><span class="cap">${t.dwFaqH}</span></div>
      <div class="dfaq">${t.dwFaq(dateList).map(([q, a]) => `<div class="dq"><div class="dq-q">${q}</div><p>${a}</p></div>`).join('')}</div>
    </div>
    ${notes ? `<button class="link-btn" data-action="openArticle" data-id="${notes.id}">${t.dropNotes} →</button>` : ''}
  </div>`;
}
function skeletons(n, ratio) { return Array.from({ length: n }, () => `<div class="skel"><div class="skel-img" style="aspect-ratio:${ratio}"></div><div class="skel-line"></div><div class="skel-line short"></div></div>`).join(''); }

// Landing page: the current volume as a full-bleed cover, then the rest of
// the issue in a band just below the fold.
function volHeroHtml(t, vol) {
  const h = VOLUME.hero;
  const season = VOLUME.season[state.lang] || VOLUME.season.en;
  const cats = CATS.filter((c) => vol.some((p) => p.cat === c));
  const chips = cats.map((c) => {
    const p = vol.find((x) => x.cat === c);
    return `<button class="vh-chip" data-action="openProduct" data-id="${p.id}">${t.curious[c]}</button>`;
  }).join('');
  const media = h.video
    ? `<video class="vh-media" autoplay muted loop playsinline poster="${h.wide}" aria-label="${esc(t.heroAlt)}">
        ${h.videoTall ? `<source media="(max-width: 760px)" src="${h.videoTall}" type="video/mp4">` : ''}<source src="${h.video}" type="video/mp4"></video>`
    : `<picture><source media="(max-width: 760px)" srcset="${h.tall}"><img class="vh-media" src="${h.wide}" alt="${esc(t.heroAlt)}" fetchpriority="high"></picture>`;
  const film = h.film ? `<a class="vh-play" href="${h.film}" target="_blank" rel="noopener"><span class="vh-play-i" aria-hidden="true"></span><span class="cap">${t.watchFilm}${h.filmLength ? ' · ' + h.filmLength : ''}</span></a>` : '';
  return `<section class="vhero">
    <div class="vh-film">${media}</div>
    ${film}
    <div class="vh-copy">
      <div class="cap vh-kicker">${t.heroKicker(VOLUME.no, season)}<span class="stamp">${t.openNow}</span></div>
      <h1 class="vh-h1">${esc(t.heroH)}</h1>
      <p class="vh-dek">${esc(t.heroDek)}</p>
      <button class="vh-cta" data-action="nav" data-view="drop">${t.volCta(VOLUME.no)} <span aria-hidden="true">→</span></button>
      ${chips && !state.loading ? `<div class="vh-ask"><div class="cap vh-q">${t.curiousQ}</div><div class="vh-chips">${chips}</div></div>` : ''}
      <div class="vh-links"><button class="vh-link dim cap" data-action="goCat" data-cat="all">${state.loading ? t.shopAll : t.shopEverything(PRODUCTS.length)}</button></div>
    </div>
  </section>`;
}

function volCard(p, t, i, n) {
  const v = viewOf(p, t);
  const start = (VOLUME.starts[p.id] && (VOLUME.starts[p.id][state.lang] || VOLUME.starts[p.id].en)) || t.startCat[p.cat] || '';
  return `<article class="vc" id="vc-${p.id}">
    <button class="vc-img" style="background:${p.bg}" aria-label="${esc(p.name)}" data-action="openProduct" data-id="${p.id}">
      ${mediaHtml(p)}<span class="cap ov-tl vc-idx">${i + 1} / ${n}</span>
    </button>
    <div class="vc-meta"><span class="flex-c">${dotHtml(v.dotColor)}${v.catLabel}${p.origin ? ' · ' + esc(p.origin) : ''}</span><span>${v.priceLabel}</span></div>
    <button class="vc-name" data-action="openProduct" data-id="${p.id}">${esc(p.name)}</button>
    ${start ? `<p class="vc-start">${esc(start)}</p>` : ''}
    <button class="link-btn small" data-action="quick" data-id="${p.id}">${v.quickLabel}</button>
  </article>`;
}

// The next-volume countdown, told as a voyage: the current volume left Seoul
// on its opening day and the next one reaches Singapore on its own. The ship
// is today.
function seasonInfo(now = new Date()) {
  const d = nextDropInfo(now);
  let open = new Date(d.next.getFullYear(), d.next.getMonth() - 1, 1);
  while (!DROP_MONTHS.includes(open.getMonth())) open = new Date(open.getFullYear(), open.getMonth() - 1, 1);
  const fmt = (x) => x.toLocaleDateString(state.lang === 'ko' ? 'ko-KR' : 'en-SG', { day: 'numeric', month: 'long' });
  const total = Math.round((d.next - open) / 86400000);
  const day = Math.min(total, Math.max(1, Math.floor((now - open) / 86400000) + 1));
  return { ...d, open, date: fmt(d.next), openDate: fmt(open), total, day, curVol: String(Math.max(1, Number(d.vol) - 1)).padStart(2, '0'), frac: Math.min(0.98, Math.max(0.02, (now - open) / (d.next - open))) };
}
function countdownHtml(t) {
  const si = seasonInfo();
  const season = DROP_MONTHS.length === 12 ? '' : t.seasons[si.next.getMonth()];
  const pct = (si.frac * 100).toFixed(1) + '%';
  const weeks = Math.floor(si.total / 7);
  const ticks = Array.from({ length: weeks - 1 }, (_, i) => `<span class="cd-tick" style="left:${(((i + 1) * 7) / si.total * 100).toFixed(2)}%"></span>`).join('');
  return `<section class="cd" aria-label="${t.cdKicker}">
    <div class="cd-left">
      <div class="cap cd-k">${t.cdKicker}</div>
      <div class="cd-num"><span class="cd-n">${si.days}</span><span class="cd-u">${t.cdDays(si.days)}</span></div>
      <div class="cd-until">${t.cdUntil(si.vol, season, si.date)}</div>
    </div>
    <div class="cd-voyage">
      <div class="cd-ends">
        <div><span class="mono small">37.56° N</span><span class="cd-place">${t.seoul}</span><span class="cd-note">${t.cdFrom(si.curVol, si.openDate)}</span></div>
        <div class="cd-end-r"><span class="mono small">1.35° N</span><span class="cd-place">${t.singapore}</span><span class="cd-note">${t.cdTo(si.vol, si.date)}</span></div>
      </div>
      <div class="cd-line" id="cd-line" style="--at:${pct}">
        <span class="cd-rest"></span><span class="cd-done"></span>${ticks}
        <span class="cd-port" style="left:0"></span><span class="cd-port" style="left:100%"></span>
        <span class="cd-ship"><span class="cd-tag cap${si.frac < 0.2 ? ' at-start' : si.frac > 0.8 ? ' at-end' : ''}">${t.cdToday(si.day, si.total)}</span></span>
      </div>
      <div class="cd-seas">${t.seaNames.map((n, i) => `<span style="left:${[16, 50, 84][i]}%">${n}</span>`).join('')}</div>
    </div>
    <button class="cd-see link-btn" data-action="nav" data-view="drop">${t.cdSee} →</button>
  </section>`;
}
// The ship sails out to today's position the first time the band scrolls
// into view; after that it simply sits there.
let cdSailed = false, cdAt = '';
function placeCountdown() {
  const line = document.getElementById('cd-line');
  if (!line) return;
  if (cdSailed || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { cdSailed = true; return; }
  cdAt = line.style.getPropertyValue('--at');
  line.style.setProperty('--at', '0%');
  checkSail();
}
function checkSail() {
  if (cdSailed) return;
  const line = document.getElementById('cd-line');
  if (!line) return;
  const r = line.getBoundingClientRect();
  if (r.top > window.innerHeight * 0.85 || r.bottom < 0) return;
  cdSailed = true;
  line.classList.add('sail');
  setTimeout(() => line.style.setProperty('--at', cdAt), 30);
}
window.addEventListener('scroll', checkSail, { passive: true });

// Article reading progress.
function syncProgress() {
  const bar = document.getElementById('ma-bar'), body = document.getElementById('ma-body');
  if (!bar || !body) return;
  const r = body.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (r.height + window.innerHeight * 0.4)));
  bar.style.transform = `scaleX(${p.toFixed(3)})`;
}
window.addEventListener('scroll', syncProgress, { passive: true });

// Home: the categories as one compact band. Each shows a real piece from
// that category instead of a general scene.
function catTilesHtml(t) {
  return CATS.map((c, i) => {
    const pick = PRODUCTS.find((p) => p.cat === c && p.photo);
    const thumb = `<span class="ci-th">${pick ? `<img src="${esc(pick.thumb || pick.photo)}" alt="" decoding="async">` : ''}</span>`;
    return `<button class="ci-row" data-action="goCat" data-cat="${c}">
      <span class="ci-no mono small">${String(i + 1).padStart(2, '0')}</span>
      <span class="ci-name">${dotHtml(CAT_COLOR[c])}${t.cats[c]}</span>
      <span class="ci-desc">${t.catDesc[c]}</span>
      ${thumb}
      <span class="ci-go mono small">${catCount(c)}</span>
    </button>`;
  }).join('');
}

function homeStoryHtml(t) {
  const post = POSTS[0];
  if (!post) return state.loading ? `<div class="home-story"><div class="hs-img skel-img"></div><div class="hs-text"><div class="skel-line"></div><div class="skel-line short"></div></div></div>` : (POSTS_STATUS === 'failed' ? `<p class="live-note">${t.storiesFail}</p>` : '');
  const look = postLook(post);
  return `<div class="home-story">
    <button class="hs-img" style="background:${look.bg}" data-action="openArticle" data-id="${post.id}">${mediaHtml(look, false)}</button>
    <div class="hs-text">
      <div class="cap flex-c hs-meta"><span class="flex-c">${dotHtml(CAT_COLOR[post.cat] || '#C1272D')}${t.cats[post.cat]}</span><span>${post.date}</span><span>${post.read}</span></div>
      <button class="hs-title" data-action="openArticle" data-id="${post.id}">${esc(post.title[state.lang])}</button>
      <p class="hs-dek">${esc(post.dek[state.lang])}</p>
      <div class="hs-links"><button class="btn-outline-dark cap" data-action="openArticle" data-id="${post.id}">${t.readStory} →</button><button class="link-btn" data-action="nav-journal">${t.jMore(POSTS.length)} →</button></div>
    </div>
  </div>`;
}

function whyHtml(t) {
  const items = t.why(sgd(FREE_SHIP));
  return `<div class="why">
    <div class="why-lead">
      <p class="why-h">${esc(t.houseH)}</p>
      <p class="why-b">${esc(t.houseB)}</p>
      <div class="why-name"><img src="assets/logo/haemun-badge.svg" alt="" width="44" height="44" loading="lazy"><span>${esc(t.whyName)}</span></div>
      <button class="link-btn" data-action="nav-about">${t.aboutMore} →</button>
    </div>
    <div class="why-grid">
      ${items.map(([h, b, act, label]) => `<div class="why-item"><div class="why-ih">${h}</div><p>${b}</p>${act ? `<button class="link-btn small" data-action="${act}">${label} →</button>` : ''}</div>`).join('')}
    </div>
  </div>`;
}

function homeHtml(t) {
  const volProducts = volumePicks();
  return `
  ${volHeroHtml(t, volProducts)}
  ${countdownHtml(t)}

  <section class="sec">
    ${sechead('01', t.catH, t.catSub, 'goCat', t.enterMall)}
    <div class="cat-index">${catTilesHtml(t)}</div>
  </section>

  <section class="sec">
    ${sechead('02', t.jH, t.jSub, 'nav-journal', t.jAll)}
    ${homeStoryHtml(t)}
  </section>

  <section class="sec">
    ${sechead('03', t.whyH, t.whySub, 'nav-about', t.aboutMore)}
    ${whyHtml(t)}
  </section>`;
}

// The current volume's own page: what's in it, and how drops work.
function dropHtml(t) {
  const vol = volumePicks();
  const h = VOLUME.hero;
  const season = VOLUME.season[state.lang] || VOLUME.season.en;
  return `
  <section class="sec-tight drop-top">
    <div class="cap muted">HAEMUN / ${t.volume}</div>
    <div class="drop-head">
      <div>
        <div class="cap vh-kicker drop-kicker">${t.heroKicker(VOLUME.no, season)}<span class="stamp">${t.openNow}</span></div>
        <h1 class="drop-h1">${t.volume}</h1>
      </div>
      <div class="drop-links"><button class="link-btn" data-action="scrollDrops">${t.howDrops} ↓</button><button class="link-btn" data-action="nav" data-view="drops">${t.pastDrops} →</button></div>
    </div>
  </section>
  <div class="drop-cover"><picture><source media="(max-width: 760px)" srcset="${h.tall}"><img src="${h.wide}" alt="${esc(t.heroAlt)}"></picture></div>
  ${themeHtml(t, vol)}

  <section class="sec sec-vol">
    ${sechead('01', t.volTitle, t.volSub, 'goCat', t.shopAll)}
    <div class="grid3 vol-grid" id="volume" style="margin-top:40px">${state.loading ? skeletons(3, '4 / 5') : vol.map((p, i) => volCard(p, t, i, vol.length)).join('')}</div>
  </section>

  <section class="sec" id="drops">
    ${sechead('02', t.dropsH, t.dropsSub, 'nav-drops', t.pastDrops)}
    ${dropsHtml(t)}
  </section>`;
}

// The volume's theme: what it is about, and why each piece is in it.
function themeHtml(t, vol) {
  const th = VOLUME.theme;
  if (!th) return '';
  const pick = (o) => (o && (o[state.lang] || o.en)) || '';
  const rows = vol.filter((p) => th.why[p.id]).map((p, i) => `
      <li><span class="cap muted">${String(i + 1).padStart(2, '0')}</span><div><button class="dt-name" data-action="openProduct" data-id="${p.id}">${esc(p.name)}</button><p>${esc(pick(th.why[p.id]))}</p></div></li>`).join('');
  return `
  <section class="sec drop-theme">
    <div class="dt-lead">
      <div class="cap muted">${t.themeCap}</div>
      <h2 class="dt-title">${esc(pick(th.title))}</h2>
      ${(th.paras[state.lang] || th.paras.en).map((x) => `<p>${esc(x)}</p>`).join('')}
      <p class="muted">${esc(t.volIntro)}</p>
    </div>
    ${rows ? `<div class="dt-why"><div class="cap muted">${t.themeWhy}</div><ol>${rows}</ol></div>` : ''}
  </section>`;
}

// Past drops: a placeholder until Volume 02 opens and Volume 01 closes.
function dropsArchiveHtml(t) {
  const si = seasonInfo();
  const season = VOLUME.season[state.lang] || VOLUME.season.en;
  const nextSeason = DROP_MONTHS.length === 12 ? '' : t.seasons[si.next.getMonth()];
  return `
  <section class="sec-tight">
    <div class="cap muted">HAEMUN / ${t.pastDrops}</div>
    <div class="shop-head"><div class="flex-b" style="align-items:baseline;gap:16px"><span class="shop-title">${t.pastDrops}</span><span class="muted">${t.pastIntro}</span></div></div>
  </section>
  <section class="sec-tight">
    <div class="archive">
      <button class="arc-card" data-action="nav" data-view="drop">
        <span class="arc-img"><img src="${VOLUME.hero.wide}" alt="" loading="lazy"></span>
        <span class="cap arc-meta"><span class="stamp">${t.openNow}</span><span>${season}</span></span>
        <span class="arc-title">${t.volume}</span>
        <span class="link-btn small">${t.viewVolume} →</span>
      </button>
      <div class="arc-card arc-next">
        <span class="arc-img arc-blank"><span class="arc-no">${si.vol}</span></span>
        <span class="cap arc-meta"><span>${t.comingOn(si.date)}</span><span>${nextSeason}</span></span>
        <span class="arc-title">${t.volumeN(si.vol)}</span>
        <span class="muted small">${t.daysLeft(si.days)}</span>
      </div>
    </div>
    <p class="arc-note">${esc(t.pastNote)}</p>
  </section>`;
}


// Shop: featured row, toolbar (filter, search, sort), then the grid.
const PRICE_BANDS = [['all', 0, Infinity], ['u50', 0, 50], ['50', 50, 100], ['100', 100, 250], ['250', 250, 1000], ['1k', 1000, Infinity]];
const money = (n) => (PREFIX[STORE_CURRENCY] || STORE_CURRENCY + ' ') + n.toLocaleString('en-SG');
function priceLabel(t, id) {
  const [, lo, hi] = PRICE_BANDS.find((b) => b[0] === id);
  if (id === 'all') return t.all;
  if (lo === 0) return t.under(money(hi));
  if (hi === Infinity) return t.over(money(lo));
  return `${money(lo)}–${money(hi)}`;
}
const collLabel = (t, id) => (id === 'vol' ? t.volume : id === 'feat' ? t.collFeat : t.all);
const brandsOf = () => [...new Set(PRODUCTS.map((p) => region(p.origin)).filter(Boolean))].sort();

function shopFilter(cat, f, q, origin) {
  const band = PRICE_BANDS.find((b) => b[0] === f.price) || PRICE_BANDS[0];
  const words = norm(q).trim().split(/\s+/).filter(Boolean);
  return PRODUCTS.filter((p) => (cat === 'all' || p.cat === cat)
    && p.price >= band[1] && p.price < band[2]
    && (f.coll === 'all' || (f.coll === 'vol' ? p.vol : p.featured))
    && (!f.stock || p.inStock !== false)
    && (origin === 'all' || region(p.origin) === origin)
    && (!words.length || words.every((w) => norm([p.name, p.ko, p.origin, p.teaser, T.en.cats[p.cat], T.ko.cats[p.cat]].join(' ')).includes(w))));
}
function shopSort(list) {
  const by = { new: (a, b) => a.arrival - b.arrival, low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, name: (a, b) => a.name.localeCompare(b.name) }[state.sort] || ((a, b) => a.arrival - b.arrival);
  return list.slice().sort(by);
}
function shopGridHtml(t, list) {
  if (state.loading) return skeletons(6, '3 / 4');
  if (list.length) return list.map((p) => cardHtml(p, t, 460, { number: false })).join('');
  const msg = state.shopQ.trim() ? t.noneQ(esc(state.shopQ.trim())) : t.none;
  return `<div class="empty">${msg} <button class="link-btn" data-action="clearFilters">${t.clear}</button></div>`;
}
function featuredRowHtml(t) {
  const picks = CATS.map((c) => PRODUCTS.find((p) => p.featured && p.cat === c)).filter(Boolean);
  if (!picks.length || state.loading) return '';
  return `<section class="feat-row">
    <div class="feat-row-head"><span class="cap">${t.featuredH}</span><span class="muted small">${t.featuredSub}</span></div>
    <div class="feat-row-items">${picks.map((p) => {
      const v = viewOf(p, t);
      return `<button class="fr-item" data-action="openProduct" data-id="${p.id}">
        <span class="fr-img" style="background:${p.bg}">${mediaHtml(p, false)}</span>
        <span class="fr-text"><span class="fr-cat">${dotHtml(v.dotColor)}${v.catLabel}</span><span class="fr-name">${esc(p.name)}</span><span class="fr-price">${v.priceLabel}</span></span>
      </button>`;
    }).join('')}</div>
  </section>`;
}
function activeChips(t) {
  const f = state.f, chips = [];
  if (f.price !== 'all') chips.push(['price', priceLabel(t, f.price)]);
  if (f.coll !== 'all') chips.push(['coll', collLabel(t, f.coll)]);
  if (f.stock) chips.push(['stock', t.inStockOnly]);
  if (state.origin !== 'all') chips.push(['origin', state.origin]);
  return chips.map(([k, label]) => `<button class="shop-chip" data-action="dropFilter" data-k="${k}">${esc(label)} <span aria-hidden="true">✕</span></button>`).join('');
}

function mallHtml(t) {
  const list = shopSort(shopFilter(state.cat, state.f, state.shopQ, state.origin));
  const mallTitle = state.cat === 'all' ? t.shopAll : t.cats[state.cat];
  const intro = state.cat === 'all' ? t.shopIntro : t.catDesc[state.cat];
  const tabs = ['all'].concat(CATS).map((c) => {
    const n = PRODUCTS.filter((p) => c === 'all' || p.cat === c).length;
    return `<button class="shop-tab${state.cat === c ? ' on' : ''}" data-action="setCat" data-cat="${c}" aria-pressed="${state.cat === c}">${c === 'all' ? '' : dotHtml(CAT_COLOR[c])}<span>${c === 'all' ? t.all : t.cats[c]}</span><span class="shop-tab-n">${state.loading ? '' : n}</span></button>`;
  }).join('');
  const sortSel = `<label class="shop-sel"><span class="sr-only">${t.sort}</span><select data-change="sort">${[['new', t.sNew], ['low', t.sLow], ['high', t.sHigh], ['name', t.sName]].map(([id, label]) => `<option value="${id}"${state.sort === id ? ' selected' : ''}>${label}</option>`).join('')}</select></label>`;
  const medNote = state.cat === 'medical' ? `<div class="med-note"><span>${t.medNote}</span><span class="cap" style="color:#2E6B5E">${t.medTag}</span></div>` : '';
  const offline = LIVE_STATUS === 'failed' ? `<div class="live-note">${t.liveFail}</div>` : '';
  return `
  <section class="shop-hero">
    <h1 class="shop-title">${mallTitle}</h1>
    <p class="shop-intro">${intro}</p>
  </section>
  ${state.cat === 'all' ? featuredRowHtml(t) : ''}
  <nav class="shop-tabs" aria-label="${t.category}"><div class="shop-tabs-in">${tabs}</div></nav>
  <section class="shop-main">
    <div class="shop-bar">
      <div class="shop-left">
        <button class="filter-btn" data-action="openFilter" aria-haspopup="dialog"><svg class="ico" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6h14M6 10h8M8.5 14h3" stroke="currentColor" stroke-width="1.4" fill="none"/></svg><span>${t.filter}</span><span class="filter-n" id="shop-count">${t.results(list.length)}</span></button>
        <span class="shop-chips">${activeChips(t)}</span>
      </div>
      <div class="shop-tools">
        <label class="shop-search"><svg class="ico" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M13 13l5 5" stroke="currentColor" stroke-width="1.4"/></svg><span class="sr-only">${t.searchShop}</span><input id="shop-q" type="search" autocomplete="off" placeholder="${t.searchShop}" value="${esc(state.shopQ)}"></label>
        ${sortSel}
      </div>
    </div>
    ${offline}${medNote}
    <div class="shop-grid" id="shop-results">${shopGridHtml(t, list)}</div>
  </section>
  ${state.filterOpen ? filterHtml(t) : ''}`;
}

// Filter drawer: choices are a draft until "Show N results" applies them.
function filterHtml(t) {
  const d = state.fDraft;
  const n = shopFilter(d.cat, d, state.shopQ, d.origin).length;
  const radios = (key, options, current) => options.map(([id, label]) => `<label class="fd-opt"><input type="radio" name="fd-${key}" data-fd="${key}" value="${esc(id)}"${current === id ? ' checked' : ''}><span>${label}</span></label>`).join('');
  const brands = brandsOf();
  const sections = [
    ['cat', t.fCat, d.cat === 'all' ? t.all : t.cats[d.cat], radios('cat', [['all', t.all]].concat(CATS.map((c) => [c, t.cats[c]])), d.cat)],
    ['price', t.fPrice, priceLabel(t, d.price), radios('price', PRICE_BANDS.map(([id]) => [id, priceLabel(t, id)]), d.price)],
    ['coll', t.fColl, collLabel(t, d.coll), radios('coll', [['all', t.all], ['vol', t.volume], ['feat', t.collFeat]], d.coll)],
    ['stock', t.fAvail, d.stock ? t.inStockOnly : t.all, `<label class="fd-opt"><input type="checkbox" data-fd="stock"${d.stock ? ' checked' : ''}><span>${t.inStockOnly}</span></label>`],
  ];
  if (brands.length > 1) sections.push(['origin', t.fBrand, d.origin === 'all' ? t.all : esc(d.origin), radios('origin', [['all', t.all]].concat(brands.map((b) => [b, esc(b)])), d.origin)]);
  return `<div class="fd-layer" role="dialog" aria-modal="true" aria-label="${t.filter}">
    <button class="fd-scrim" data-action="closeFilter" aria-label="${t.close}"></button>
    <aside class="fd-panel">
      <div class="fd-head"><span class="cap">${t.filter}</span><button class="fd-x" data-action="closeFilter" aria-label="${t.close}">✕</button></div>
      <div class="fd-body">${sections.map(([key, title, summary, body]) => {
        const open = state.fSec === key;
        return `<div class="fd-sec${open ? ' open' : ''}">
          <button class="fd-sh" data-action="fdSec" data-k="${key}" aria-expanded="${open}"><span><span class="fd-title">${title}</span><span class="fd-sum">${summary}</span></span><svg class="fd-chev" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
          ${open ? `<div class="fd-opts">${body}</div>` : ''}
        </div>`;
      }).join('')}</div>
      <div class="fd-foot"><button class="fd-clear" data-action="fdClear">${t.clearAll}</button><button class="fd-apply" data-action="fdApply">${t.showResults(n)}</button></div>
    </aside>
  </div>`;
}

// Editorial: laid out like a magazine issue. Masthead and sections, a cover
// story, a contents page, a feature spread, then the rest of the issue.
const ED_SECTIONS = CATS.concat('house');
const edSection = (t, c) => t.cats[c] || t.cats.house;
function edMeta(t, j, withBy) {
  return `<span class="cap ed-meta">${withBy ? `<span>${t.edBy} ${esc(j.author)}</span>` : ''}<span>${j.date}</span><span>${j.read}</span></span>`;
}
function edCard(t, j, size) {
  const look = postLook(j);
  return `<button class="ed-card ed-${size}" data-action="openArticle" data-id="${j.id}">
    <span class="ed-img" style="background:${look.bg}">${mediaHtml(look, false)}</span>
    <span class="cap ed-kick">${edSection(t, j.cat)}</span>
    <span class="ed-title">${esc(j.title[state.lang])}</span>
    <span class="ed-dek">${esc(j.dek[state.lang])}</span>
    ${edMeta(t, j, false)}
  </button>`;
}
function journalHtml(t) {
  const posts = POSTS.filter((j) => state.jcat === 'all' || j.cat === state.jcat);
  const season = VOLUME.season[state.lang] || VOLUME.season.en;
  const sections = ['all'].concat(ED_SECTIONS.filter((c) => POSTS.some((j) => j.cat === c))).map((c) => {
    const n = c === 'all' ? POSTS.length : POSTS.filter((j) => j.cat === c).length;
    return `<button class="ed-sec${state.jcat === c ? ' on' : ''}" data-action="setJcat" data-jcat="${c}" aria-pressed="${state.jcat === c}"><span>${c === 'all' ? t.all : edSection(t, c)}</span><span class="ed-sec-n">${String(n).padStart(2, '0')}</span></button>`;
  }).join('');
  const [cover, a, b, ...rest] = posts;
  const coverLook = cover && postLook(cover);
  const coverHtml = cover ? `<button class="ed-cover" data-action="openArticle" data-id="${cover.id}">
      <span class="ed-cover-img" style="background:${coverLook.bg}">${mediaHtml(coverLook, false)}</span>
      <span class="ed-cover-copy">
        <span class="cap ed-cover-kick">${t.edCover} · ${edSection(t, cover.cat)}</span>
        <span class="ed-cover-title">${esc(cover.title[state.lang])}</span>
        <span class="ed-cover-dek">${esc(cover.dek[state.lang])}</span>
        ${edMeta(t, cover, true)}
      </span>
    </button>` : '';
  const contents = posts.length > 1 ? `<section class="ed-contents">
      <div class="ed-contents-h"><div class="cap muted">${t.edContents}</div><div class="ed-contents-t">${season}</div></div>
      <ol class="ed-toc">${posts.map((j, i) => `<li><button data-action="openArticle" data-id="${j.id}">
        <span class="ed-toc-n mono">${String(i + 1).padStart(2, '0')}</span>
        <span class="ed-toc-t">${esc(j.title[state.lang])}</span>
        <span class="ed-toc-dots" aria-hidden="true"></span>
        <span class="cap ed-toc-s">${edSection(t, j.cat)} · ${j.read}</span>
      </button></li>`).join('')}</ol>
    </section>` : '';
  const spread = a ? `<section class="ed-spread">${edCard(t, a, 'lead')}${b ? edCard(t, b, 'side') : ''}</section>` : '';
  const more = rest.length ? `<section class="ed-more">${rest.map((j) => edCard(t, j, 'std')).join('')}</section>` : '';
  return `
  <section class="ed-mast">
    <div class="ed-run cap"><span>Haemun ${t.journal}</span><span>${season} · ${t.volume}</span><span>${state.loading ? '' : t.edStories(POSTS.length)}</span></div>
    <h1 class="sr-only">${t.journal}</h1>
    <div class="ed-under"><p class="ed-tag">${t.jIntro}</p><nav class="ed-secs" aria-label="${t.category}">${sections}</nav></div>
  </section>
  ${posts.length ? coverHtml + contents + spread + more : state.loading ? `<div class="ed-cover ed-cover-skel skel-img"></div>` : `<p class="ed-empty">${POSTS_STATUS === 'failed' ? t.storiesFail : t.none}</p>`}`;
}

function articleHtml(t, post) {
  const pr = post.product ? findProduct(post.product) : null;
  const art = postLook(post);
  const i = POSTS.indexOf(post);
  const next = POSTS.length > 1 ? POSTS[(i + 1) % POSTS.length] : null;
  const [first, ...paras] = post.paras;
  const productBlock = pr ? `<aside class="ma-product">
      <span class="ma-p-img" style="background:${pr.bg}">${mediaHtml(pr, false)}</span>
      <div><div class="cap muted">${t.inStory}</div><div class="ma-p-name">${esc(pr.name)}</div><div class="ma-p-price">${viewOf(pr, t).priceLabel}</div></div>
      <button class="btn-outline-dark cap" data-action="openProduct" data-id="${pr.id}">${t.view} →</button>
    </aside>` : '';
  const nextLook = next && postLook(next);
  const nextHtml = next ? `<section class="ma-next">
      <div class="cap muted">${t.edNext}</div>
      <button class="ma-next-card" data-action="openArticle" data-id="${next.id}">
        <span class="ma-next-img" style="background:${nextLook.bg}">${mediaHtml(nextLook, false)}</span>
        <span class="ma-next-copy"><span class="cap ed-kick">${edSection(t, next.cat)}</span><span class="ma-next-title">${esc(next.title[state.lang])}</span><span class="ed-dek">${esc(next.dek[state.lang])}</span><span class="link-btn">${t.readStory} →</span></span>
      </button>
    </section>` : '';
  return `
  <div class="ma-progress" aria-hidden="true"><span id="ma-bar"></span></div>
  <article class="ma">
    <header class="ma-hero">
      <span class="ma-hero-img" style="background:${art.bg}">${mediaHtml(art, false)}</span>
      <div class="ma-hero-copy">
        <button class="cap ma-back" data-action="nav" data-view="journal">← ${t.journal}</button>
        <div class="cap ma-kick">${edSection(t, post.cat)}</div>
        <h1 class="ma-title">${esc(post.title[state.lang])}</h1>
        <p class="ma-dek">${esc(post.dek[state.lang])}</p>
      </div>
    </header>
    <div class="ma-bar">
      ${edMeta(t, post, true)}
      <button class="cap ma-share" data-action="copyLink">${t.edShare}</button>
    </div>
    <div class="ma-body" id="ma-body">
      ${first ? `<p class="ma-lede">${esc(first)}</p>` : ''}
      ${paras.map((p) => `<p>${esc(p)}</p>`).join('')}
      ${productBlock}
      <div class="ma-end" aria-hidden="true">■</div>
    </div>
    ${nextHtml}
  </article>`;
}

function aboutHtml(t) {
  const carry = CATS.map((c) => `<button class="ab-cat" data-action="goCat" data-cat="${c}">
      <span class="ab-cat-img"><img src="${CAT_IMAGES[c]}" alt="" loading="lazy"></span>
      <span class="ab-cat-t"><span class="cat-name">${dotHtml(CAT_COLOR[c])}${t.cats[c]}</span><span class="cat-desc">${t.catDesc[c]}</span></span>
      <span class="mono small muted">${catCount(c)}</span>
    </button>`).join('');
  const facts = t.facts.map(([k, v]) => `<div class="fact"><span class="cap muted">${k}</span><span>${v}</span></div>`).join('');
  return `
  <section class="ab-hero">
    <img class="ab-hero-img" src="assets/about/makers.jpg" alt="">
    <div class="ab-hero-copy">
      <div class="cap ab-k">${t.abKicker}</div>
      <h1 class="ab-h1">${esc(t.abH)}</h1>
      <p class="ab-lede">${esc(t.abLede)}</p>
    </div>
  </section>

  <section class="sec ab-name">
    <div class="ab-name-intro">
      <div class="cap muted">${t.abNameH}</div>
      <p>${esc(t.abNameIntro)}</p>
    </div>
    <div class="ab-parts">${t.abParts.map(([hangul, hanja, rom, mean, line], i) => `${i ? '<span class="ab-plus" aria-hidden="true">+</span>' : ''}<div class="ab-part">
        <div class="ab-glyphs"><span class="ab-hangul" lang="ko">${hangul}</span><span class="ab-hanja" lang="ko">${hanja}</span></div>
        <div class="ab-read"><span class="mono">${rom}</span><span class="ab-mean">${mean}</span></div>
        <p>${line}</p>
      </div>`).join('')}</div>
    <div class="ab-sea"><span class="ab-sea-word">SEA</span><p>${esc(t.abSea)}</p></div>
    <p class="ab-sum">${esc(t.abSum)}</p>
  </section>

  <section class="sec">
    ${sechead('01', t.abWhyH, '')}
    <div class="ab-story">
      <div class="ab-story-img"><img src="assets/about/lab.jpg" alt="" loading="lazy"></div>
      <div class="ab-story-text">${t.aboutParas.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    </div>
  </section>

  <section class="sec">
    ${sechead('02', t.abHowH, t.aHowSub)}
    <ol class="ab-how">${t.how.map(([n, h, b]) => `<li><span class="mono small muted">${n}</span><span class="ab-how-h">${h}</span><p>${b}</p></li>`).join('')}</ol>
  </section>

  <section class="sec">
    ${sechead('03', t.abCarryH, t.aCarrySub, 'goCat', t.enterMall)}
    <div class="ab-cats">${carry}</div>
  </section>

  <section class="ab-join">
    <div class="cap ab-k">${t.abJoinH}</div>
    <div class="ab-join-grid">
      <div><div class="ab-join-h">${t.abMakerH}</div><p>${esc(t.abMakerB)}</p><div class="ab-join-links"><button class="ab-btn" data-action="nav" data-view="brands">${t.abBrandsCta} →</button><span class="ab-write">${t.abWrite}</span></div></div>
      <div><div class="ab-join-h">${t.abShopH}</div><p>${esc(t.abShopB)}</p><div class="ab-join-links"><button class="ab-btn" data-action="enableTrade">${t.abTradeCta} →</button></div></div>
    </div>
  </section>

  <section class="sec">
    ${sechead('04', t.aCo, t.aCoSub)}
    <div class="facts ab-facts">${facts}</div>
  </section>`;
}

// Brands we carry, from WooCommerce's Brands taxonomy. A brand's description
// is written as plain lines in WooCommerce: the first line is its tagline,
// lines like "Founded: 2019" become facts, and the rest is its story.
function brandParts(b) {
  const facts = [], story = [];
  b.desc.slice(1).forEach((line) => { const m = line.match(/^([^:]{2,24}):\s+(.+)$/); if (m) facts.push([m[1], m[2]]); else story.push(line); });
  return { tagline: b.desc[0] || '', facts, story };
}
const brandItems = (b) => PRODUCTS.filter((p) => region(p.origin) === b.name);
const brandImage = (b) => b.image || ((brandItems(b)[0] || {}).photo) || null;
function brandsHtml(t) {
  const tiles = BRANDS.map((b) => {
    const img = brandImage(b), { tagline } = brandParts(b);
    return `<button class="bg-tile" data-action="openBrand" data-slug="${esc(b.slug)}">
      <span class="bg-img">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<span class="br-mono">${esc(b.name.slice(0, 1))}</span>`}</span>
      <span class="bg-name">${esc(b.name)}</span>
      <span class="bg-tag">${tagline ? esc(tagline) : t.brNoDesc}</span>
      <span class="mono small muted">${t.brPieces(b.count)}</span>
    </button>`;
  }).join('');
  const join = `<div class="bg-tile bg-join">
      <span class="bg-join-in"><span class="cap">${t.brMakerH}</span><span class="bg-join-b">${esc(t.brMakerB)}</span><span class="bg-join-w">${t.abWrite}</span></span>
    </div>`;
  return `
  <section class="pg-head">
    <div class="cap muted">HAEMUN / ${t.brands}</div>
    <div class="pg-row"><h1 class="pg-h1">${t.brH}</h1><p class="pg-lede">${esc(t.brLede)}</p></div>
  </section>
  <section class="sec-tight">
    <div class="bg-grid">${state.loading ? skeletons(4, '4 / 5') : tiles + join}</div>
  </section>
  <section class="ab-join br-cta">
    <div class="ab-join-grid">
      <div><div class="ab-join-h">${t.brStockH}</div><p>${esc(t.brStockB)}</p><div class="ab-join-links"><button class="ab-btn" data-action="enableTrade">${t.abTradeCta} →</button></div></div>
      <div><div class="ab-join-h">${t.brMakerH}</div><p>${esc(t.brMakerB)}</p><div class="ab-join-links"><span class="ab-write">${t.abWrite}</span></div></div>
    </div>
  </section>`;
}
// One brand: its story and facts beside a photo, then everything we carry by it.
function brandHtml(t) {
  const b = BRANDS.find((x) => x.slug === state.brand);
  if (!b) return state.loading ? `<section class="pg-head">${skeletons(1, '4 / 3')}</section>` : brandsHtml(t);
  const { tagline, facts, story } = brandParts(b);
  const img = brandImage(b), items = brandItems(b);
  return `
  <section class="pg-head">
    <button class="tlink cap" data-action="nav" data-view="brands">← ${t.brands}</button>
  </section>
  <section class="bd">
    <div class="bd-img">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ''}</div>
    <div class="bd-text">
      <div class="cap muted">${t.brKicker}</div>
      <h1 class="pg-h1 bd-name">${esc(b.name)}</h1>
      ${tagline ? `<p class="bd-tag">${esc(tagline)}</p>` : ''}
      ${story.map((p) => `<p class="bd-p">${esc(p)}</p>`).join('') || `<p class="bd-p">${t.brNoDesc}</p>`}
      ${facts.length ? `<dl class="bd-facts">${facts.map(([k, v]) => `<div><dt class="cap muted">${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      <div class="bd-links"><button class="btn-outline-dark cap" data-action="shopBrand" data-name="${esc(b.name)}">${t.brShop(esc(b.name))} →</button><button class="link-btn" data-action="enableTrade">${t.abTradeCta} →</button></div>
    </div>
  </section>
  ${items.length ? `<section class="sec">
    ${sechead('01', t.brPiecesBy(esc(b.name)), t.brPieces(items.length))}
    <div class="shop-grid" style="margin-top:40px">${items.map((p) => cardHtml(p, t, 460, { number: false })).join('')}</div>
  </section>` : ''}`;
}

function routeAndFooter(t) {
  return `
  <footer class="site-footer">
    <div class="f-col f-brand"><img class="f-lockup" src="assets/logo/haemun-logo-horizontal.svg" alt="Haemun" width="210" height="80" loading="lazy"><div class="muted">${t.footer}</div></div>
    <div class="f-col"><div class="f-h">${t.shop}</div>${CATS.map((c) => `<button class="tlink f-link" data-action="goCat" data-cat="${c}">${t.cats[c]}</button>`).join('')}</div>
    <div class="f-col"><div class="f-h">${t.fHouse}</div><button class="tlink f-link" data-action="nav" data-view="drop">${t.volume}</button><button class="tlink f-link" data-action="nav" data-view="drops">${t.pastDrops}</button><button class="tlink f-link" data-action="nav" data-view="brands">${t.brands}</button><button class="tlink f-link" data-action="nav" data-view="journal">${t.journal}</button><button class="tlink f-link" data-action="nav" data-view="about">${t.about}</button><button class="tlink f-link" data-action="enableTrade">${t.trade}</button></div>
    <div class="f-col"><div class="f-h">${t.fHelp}</div><div class="muted">${t.fShip}<br>${t.fReturns}<br>${t.fContact}</div></div>
    <div class="f-col"><div class="f-h">Singapore</div><div class="muted">Haemun Pte. Ltd.<br>[ADDRESS]<br>© 2026</div></div>
  </footer>`;
}

function pdpHtml(t) {
  const raw = PRODUCTS.find((p) => p.id === state.activeId);
  if (!raw) return '';
  const v = viewOf(raw, t);
  const svc = raw.service, tiersOk = state.b2b && !svc;
  const unit = tiersOk ? raw.price * 0.55 : raw.price;
  const step = tiersOk ? raw.moq : 1;
  const lineTotal = svc ? t.from + ' ' + sgd(unit) : sgd(unit * state.qty);
  const addLabel = svc ? t.enquire : state.b2b ? t.inquire : t.add;
  const comp = {
    beauty: [['Status', 'HSA notified under the ASEAN Cosmetic Directive'], ['Notification no.', '[HSA REF NO.]'], ['Manufacture', 'ISO 22716 GMP, MFDS licensed facility']],
    wellness: [['Status', 'HSA notified under the Health Supplements Guidelines'], ['Notification no.', '[HSA REF NO.]'], ['Manufacture', 'GMP certified facility']],
    pet: [['Status', 'Imported under AVS (NParks) requirements'], ['Permit no.', '[AVS PERMIT NO.]']],
    fashion: [['Origin', 'Made in Korea'], ['Materials', 'Fibre content labelled in English and Korean']],
    medical: [['Providers', 'Licensed Korean medical institutions'], ['Accreditation', '[PROVIDER ACCREDITATION]'], ['Booking', 'Only after a consultation with the provider']],
  }[raw.cat];
  const rows = state.tab === 'form' ? (raw.form || []) : state.tab === 'prov' ? raw.prov : comp.concat([['Importer', 'Haemun Pte. Ltd., Singapore']]);
  const tabs = [['form', t.tabF], ['prov', t.tabP], ['spec', t.tabS]].map(([id, label]) => `<button class="tlink" data-action="setTab" data-tab="${id}" style="${state.tab === id ? 'color:#0B0B0C;text-decoration:underline' : 'color:#7A7A78'}">${label}</button>`).join('');
  const qtyBlock = svc ? '' : `<div class="qty"><button data-action="qty" data-delta="-1">−</button><span class="mono">${state.qty}</span><button data-action="qty" data-delta="1">+</button></div>`;
  const related = suggest(raw, [raw.id], 3);
  const gallery = raw.gallery || [];
  const mainImg = gallery.length ? `<img src="${esc(gallery[state.photoIdx] || gallery[0])}" alt="${esc(raw.name)}" style="width:100%;height:100%;object-fit:cover;display:block">` : mediaHtml(raw);
  const thumbs = gallery.length > 1 ? `<div class="pdp-thumbs">${gallery.map((src, i) => `<button class="pdp-thumb${i === state.photoIdx ? ' on' : ''}" data-action="setPhoto" data-idx="${i}" aria-label="Photo ${i + 1}" aria-pressed="${i === state.photoIdx}"><img src="${esc(src)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></button>`).join('')}</div>` : '';
  return `
  <div class="modal-backdrop pdp" role="dialog" aria-modal="true" aria-label="${esc(raw.name)}">
    <div class="pdp-img">
      <div class="pdp-photo" style="background:${raw.bg}">${mainImg}<span class="cap ov-tl">${v.no}</span>${gallery.length > 1 ? `
        <button class="pdp-arrow prev" data-action="photoStep" data-delta="-1" aria-label="Previous photo">‹</button>
        <button class="pdp-arrow next" data-action="photoStep" data-delta="1" aria-label="Next photo">›</button>
        <span class="cap pdp-count">${state.photoIdx + 1} / ${gallery.length}</span>` : ''}</div>
      ${thumbs}
    </div>
    <div class="pdp-body">
      <div class="pdp-top"><span class="cap muted">${t.shop} / ${v.catLabel}</span><button class="tlink" data-action="closeProduct">${t.close} ✕</button></div>
      <div class="pdp-origin flex-c">${dotHtml(v.dotColor)}${esc(raw.origin || v.catLabel)}</div>
      <h1 class="pdp-name">${esc(raw.name)}</h1>
      <div class="pdp-ko">${esc(raw.ko)}</div>
      <div class="pdp-price-row"><span class="pdp-price">${v.priceLabel}</span><span class="cap muted">${v.priceNote} · ${raw.cat === 'beauty' || raw.cat === 'wellness' ? 'HSA NOTIFIED' : raw.cat === 'pet' ? 'AVS CLEARED' : raw.cat === 'medical' ? 'BY CONSULTATION' : 'MADE IN KOREA'}</span></div>
      <div class="pdp-cta">
        <div class="pdp-cta-row">
          ${qtyBlock}
          <button class="btn-solid" data-action="addActive"><span>${addLabel}</span><span class="mono">${lineTotal}</span></button>
        </div>
        <ul class="trust">${t.trust.map((x) => `<li>${x}</li>`).join('')}</ul>
      </div>
      <div class="pdp-tabs">${tabs}</div>
      <div class="pdp-rows">${state.tab === 'form' && raw.desc && raw.desc.length ? `<div class="pdp-desc">${raw.desc.map((line) => line.startsWith('\u2022') ? `<p class="pdp-li">${esc(line.slice(1).trim())}</p>` : `<p>${esc(line)}</p>`).join('')}</div>` : ''}${rows.map(([k, val]) => `<div class="pdp-row"><span class="mono small muted">${esc(k)}</span><span>${esc(val)}</span></div>`).join('')}</div>
      ${related.length ? `<div class="pdp-related"><div class="cap muted">${t.related}</div><div class="rel-grid">${related.map((r) => miniCard(r, t)).join('')}</div></div>` : ''}
    </div>
  </div>`;
}

function cartHtml(t) {
  const ids = Object.keys(state.cart).filter(findProduct);
  const lines = ids.map((id) => {
    const p = findProduct(id), q = state.cart[id];
    return `<div class="cart-line">
      <div class="cart-thumb" style="background:${p.bg}">${mediaHtml(p, false)}</div>
      <div><div style="font-weight:500">${esc(p.name)}</div><div class="muted">${esc(p.origin)}</div>
        <div class="qty" style="margin-top:10px"><button data-action="cartQty" data-id="${id}" data-delta="-1">−</button><span class="mono">${q}</span><button data-action="cartQty" data-id="${id}" data-delta="1">+</button></div>
      </div>
      <span style="font-weight:500">${sgd(p.price * q)}</span>
    </div>`;
  }).join('');
  const sub = ids.reduce((a, id) => a + findProduct(id).price * state.cart[id], 0);
  const last = findProduct(ids[ids.length - 1]);
  const pairs = last ? suggest(last, ids, 2).filter((p) => !p.service) : [];
  const ship = !ids.length || !FREE_SHIP ? '' : sub >= FREE_SHIP
    ? `<div class="ship"><div class="ship-bar"><span style="width:100%"></span></div><p>${t.shipDone}</p></div>`
    : `<div class="ship"><div class="ship-bar"><span style="width:${Math.round((sub / FREE_SHIP) * 100)}%"></span></div><p>${t.shipTo(sgd(FREE_SHIP - sub))}</p></div>`;
  const pairHtml = pairs.length ? `<div class="pairs"><div class="cap muted">${t.pairs}</div>${pairs.map((p) => `<div class="pair">
      <button class="pair-img" style="background:${p.bg}" data-action="openProduct" data-id="${p.id}" aria-label="${esc(p.name)}">${mediaHtml(p, false)}</button>
      <div><div style="font-weight:500">${esc(p.name)}</div><div class="muted">${viewOf(p, t).priceLabel}</div></div>
      <button class="link-btn small" data-action="cartQty" data-id="${p.id}" data-delta="1">${t.addShort}</button></div>`).join('')}</div>` : '';
  return `
  <div class="modal-backdrop cart-backdrop">
    <button class="cart-scrim" data-action="closeCart" aria-label="Close"></button>
    <aside class="cart-panel" role="dialog" aria-modal="true" aria-label="${t.bag}">
      <div class="cart-head"><span class="cap">${t.bag} (${cartCount()})</span><button class="tlink" data-action="closeCart">${t.close} ✕</button></div>
      ${ship}<div class="cart-lines">${lines ? lines + pairHtml : `<div class="cart-empty"><p class="muted">${t.empty}</p><button class="btn-outline-dark cap" data-action="goCat" data-cat="all">${t.enterMall} →</button></div>`}</div>
      <div class="cart-foot">
        <div class="flex-b" style="font-size:14px;font-weight:500"><span>${t.subtotal}</span><span>${sgd(sub)}</span></div>
        <div class="muted" style="margin-top:6px">${t.gst}</div>
        ${state.cartMsg ? `<p class="cart-msg">${state.cartMsg}</p>` : ''}<button class="btn-solid cap" data-action="checkout" style="width:100%;margin-top:20px;justify-content:center" ${ids.length ? '' : 'disabled'}>${t.checkout}</button>
      </div>
    </aside>
  </div>`;
}

function render() {
  const t = T[state.lang];
  let body = '';
  if (state.view === 'home') body = homeHtml(t);
  else if (state.view === 'drop') body = dropHtml(t);
  else if (state.view === 'drops') body = dropsArchiveHtml(t);
  else if (state.view === 'trade') body = tradeHtml(t);
  else if (state.view === 'tradeorders') body = tradeOrdersHtml(t);
  else if (state.view === 'brands') body = brandsHtml(t);
  else if (state.view === 'brand') body = brandHtml(t);
  else if (state.view === 'mall') body = mallHtml(t);
  else if (state.view === 'journal') body = journalHtml(t);
  else if (state.view === 'article') {
    const post = POSTS.find((j) => j.id === state.postId);
    body = post ? articleHtml(t, post) : journalHtml(t);
  } else if (state.view === 'about') body = aboutHtml(t);

  document.documentElement.lang = state.lang;
  document.body.style.overflow = state.activeId || state.cartOpen || state.searchOpen || state.filterOpen ? 'hidden' : '';
  const prevVideo = document.querySelector('.vh-media');
  const videoAt = prevVideo && prevVideo.tagName === 'VIDEO' ? prevVideo.currentTime : 0;
  document.getElementById('app').innerHTML = `
    ${header(t)}
    ${body}
    ${routeAndFooter(t)}
    ${pdpHtml(t)}
    ${state.cartOpen ? cartHtml(t) : ''}
    ${state.searchOpen ? searchHtml(t) : ''}
  `;
  const video = document.querySelector('video.vh-media');
  if (video && videoAt) video.currentTime = videoAt;
  playIntro();
  syncHeader();
  placeCountdown();
  syncProgress();
}


// The header sits transparent on the hero (desktop only) until the hero
// scrolls away.
function filmHeader() {
  if (state.view !== 'home' || window.innerWidth <= 1100) return false;
  return !!document.querySelector('.vhero') && window.scrollY < 40;
}
function syncHeader() {
  const h = document.querySelector('.site-header');
  if (h) h.classList.toggle('on-film', filmHeader());
}
window.addEventListener('scroll', syncHeader, { passive: true });
window.addEventListener('resize', syncHeader);

// One orchestrated moment: the cover settles in on first view, and never
// replays on later re-renders.
let introPlayed = false;
function playIntro() {
  if (introPlayed || state.view !== 'home') return;
  const media = document.querySelector('.vh-media'), copy = document.querySelector('.vh-copy');
  if (!media || !copy) return;
  introPlayed = true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !media.animate) return;
  const ease = 'cubic-bezier(.2,.7,.2,1)';
  media.animate([{ transform: 'scale(1.06)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 2200, easing: ease });
  copy.animate([{ transform: 'translateY(18px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 1100, delay: 450, easing: ease, fill: 'backwards' });
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (a === 'nav') go({ view: el.dataset.view, postId: null });
  else if (a === 'nav-journal') go({ view: 'journal', postId: null });
  else if (a === 'nav-about') go({ view: 'about' });
  else if (a === 'nav-drops') go({ view: 'drops' });
  else if (a === 'copyLink') {
    const done = () => { el.textContent = T[state.lang].edCopied; setTimeout(() => { el.textContent = T[state.lang].edShare; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done); else done();
  }
  else if (a === 'openBrand') go({ view: 'brand', brand: el.dataset.slug });
  else if (a === 'shopBrand') go({ view: 'mall', cat: 'all', origin: el.dataset.name });
  else if (a === 'setCat') { go({ view: 'mall', cat: el.dataset.cat, origin: 'all' }); return; }
  else if (a === 'goCat') go({ view: 'mall', cat: el.dataset.cat || 'all', origin: 'all' });
  else if (a === 'openArticle') go({ view: 'article', postId: el.dataset.id });
  else if (a === 'openProduct') openProduct(el.dataset.id);
  else if (a === 'openSearch') openSearch();
  else if (a === 'closeSearch') setState({ searchOpen: false });
  else if (a === 'checkout') {
    const live = Object.keys(state.cart).filter((id) => id.startsWith('wc') && findProduct(id));
    if (!live.length) { setState({ cartMsg: T[state.lang].demoNote }); return; }
    setState({ cartMsg: T[state.lang].toCheckout });
    location.href = `${WP_SITE}/?haemun_cart=${live.map((id) => id.slice(2) + ':' + state.cart[id]).join(',')}`;
  }
  else if (a === 'setPhoto') setState({ photoIdx: Number(el.dataset.idx) });
  else if (a === 'photoStep') stepPhoto(Number(el.dataset.delta));
  else if (a === 'quick') {
    const p = PRODUCTS.find((x) => x.id === el.dataset.id);
    if (p.service || state.b2b) openProduct(p.id, { qty: state.b2b && !p.service ? p.moq : 1, tab: p.service ? 'form' : 'spec' });
    else { addToCart(p.id, 1); setState({ cartOpen: true }); }
  }
  else if (a === 'closeProduct') closeProduct();
  else if (a === 'setTab') setState({ tab: el.dataset.tab });
  else if (a === 'qty') {
    const raw = PRODUCTS.find((p) => p.id === state.activeId);
    const step = state.b2b && !raw.service ? raw.moq : 1;
    setState({ qty: Math.max(step, state.qty + Number(el.dataset.delta) * step) });
  }
  else if (a === 'addActive') {
    const raw = PRODUCTS.find((p) => p.id === state.activeId);
    if (raw.service || state.b2b) closeProduct();
    else { addToCart(raw.id, state.qty); closeProduct({ cartOpen: true, cartMsg: null }); }
  }
  else if (a === 'openCart') setState({ cartOpen: true, cartMsg: null, searchOpen: false });
  else if (a === 'closeCart') setState({ cartOpen: false });
  else if (a === 'cartQty') addToCart(el.dataset.id, Number(el.dataset.delta));
  else if (a === 'setOrigin') setState({ origin: el.dataset.origin });
  else if (a === 'setSort') setState({ sort: el.dataset.sort });
  else if (a === 'clearFilters') { setState({ origin: 'all', shopQ: '', f: { price: 'all', coll: 'all', stock: false } }); }
  else if (a === 'openFilter') setState({ filterOpen: true, fSec: state.fSec || 'cat', fDraft: { ...state.f, cat: state.cat, origin: state.origin } });
  else if (a === 'closeFilter') setState({ filterOpen: false, fDraft: null });
  else if (a === 'fdSec') setState({ fSec: state.fSec === el.dataset.k ? null : el.dataset.k });
  else if (a === 'fdClear') setState({ fDraft: { price: 'all', coll: 'all', stock: false, cat: 'all', origin: 'all' } });
  else if (a === 'fdApply') {
    const { cat, origin, ...f } = state.fDraft;
    setState({ f, cat, origin, filterOpen: false, fDraft: null });
    history.replaceState(null, '', toHash());
  }
  else if (a === 'dropFilter') {
    const k = el.dataset.k;
    if (k === 'origin') setState({ origin: 'all' });
    else setState({ f: { ...state.f, [k]: k === 'stock' ? false : 'all' } });
  }
  else if (a === 'setJcat') setState({ jcat: el.dataset.jcat });
  else if (a === 'toggleTrade') setState({ b2b: !state.b2b });
  else if (a === 'enableTrade') go({ view: 'trade' });
  else if (a === 'setLang') setState({ lang: el.dataset.lang });
  else if (a === 'scrollDrops') { const d = document.getElementById('drops'); if (d) window.scrollTo({ top: d.getBoundingClientRect().top + scrollY - 120, behavior: 'smooth' }); }
});

Object.assign(state, fromHash());
render();
Promise.allSettled([loadProducts(), loadPosts(), loadBrands()]).finally(() => setState({ loading: false }));
