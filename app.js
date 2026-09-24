/* Haemun storefront — vanilla JS rewrite of the DCLogic prototype. */
const sgd = (n) => 'S$ ' + n.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dotHtml = (c) => `<span class="dot" style="background:${c}"></span>`;
const region = (o) => o.split(',')[0];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const state = {
  lang: 'en', b2b: false, view: 'volume', cat: 'all', origin: 'all', sort: 'feat',
  jcat: 'all', postId: null, cart: {}, cartOpen: false, activeId: null, tab: 'form', qty: 1, photoIdx: 0,
};

function setState(patch) { Object.assign(state, patch); render(); }
function addToCart(id, n) {
  const c = { ...state.cart };
  c[id] = Math.max(0, (c[id] || 0) + n);
  if (!c[id]) delete c[id];
  setState({ cart: c });
}
function go(patch) { setState({ activeId: null, ...patch }); window.scrollTo(0, 0); }

function shapeSvg(p, label = true) {
  const L = (y, size, sp) => label ? `<text x="150" y="${y}" text-anchor="middle" font-family="IBM Plex Sans KR" font-weight="600" font-size="${size}" letter-spacing="${sp}" fill="#0B0B0C">HAEMUN</text>` : '';
  const shape = p.shape;
  let inner = '';
  if (shape === 'jar') inner = `<rect x="96" y="210" width="108" height="88" fill="url(#hmPorc)"></rect><rect x="100" y="190" width="100" height="22" fill="url(#hmCap)"></rect>${L(258,7,3)}`;
  else if (shape === 'dropper') inner = `<rect x="124" y="188" width="52" height="110" fill="${p.fill}"></rect><rect x="124" y="188" width="52" height="110" fill="url(#hmSheen)"></rect><rect x="132" y="168" width="36" height="22" fill="url(#hmCap)"></rect><path d="M140 168 V136 a10 10 0 0 1 20 0 V168 z" fill="url(#hmCap)"></path><rect x="130" y="228" width="40" height="34" fill="#F7F6F2"></rect>${L(248,5,2)}`;
  else if (shape === 'bottle') inner = `<path d="M116 178 Q116 166 130 164 L170 164 Q184 166 184 178 L184 298 L116 298 Z" fill="${p.fill}"></path><path d="M116 178 Q116 166 130 164 L170 164 Q184 166 184 178 L184 298 L116 298 Z" fill="url(#hmSheen)"></path><rect x="138" y="136" width="24" height="30" fill="url(#hmCap)"></rect><rect x="126" y="220" width="48" height="40" fill="#F7F6F2"></rect>${L(243,5,2)}`;
  else if (shape === 'box') inner = `<rect x="108" y="140" width="84" height="158" fill="url(#hmPorc)"></rect><rect x="108" y="140" width="84" height="6" fill="${p.fill}"></rect>${L(214,7,3)}`;
  else if (shape === 'tee') inner = `<rect x="84" y="214" width="132" height="84" fill="${p.fill}"></rect><rect x="84" y="214" width="132" height="84" fill="url(#hmSheen)" opacity=".5"></rect><path d="M130 214 L150 236 L170 214 Z" fill="#0B0B0C" fill-opacity=".25"></path><line x1="84" y1="256" x2="216" y2="256" stroke="#0B0B0C" stroke-opacity=".18"></line><rect x="84" y="200" width="132" height="14" fill="${p.fill}"></rect><rect x="84" y="200" width="132" height="14" fill="#FFFFFF" fill-opacity=".12"></rect>`;
  else if (shape === 'bag') inner = `<path d="M122 176 C 122 140, 178 140, 178 176" fill="none" stroke="#0B0B0C" stroke-width="5"></path><rect x="94" y="172" width="112" height="126" fill="${p.fill}"></rect><rect x="94" y="172" width="112" height="126" fill="url(#hmSheen)"></rect><rect x="138" y="224" width="24" height="16" fill="url(#hmPorc)"></rect>`;
  else if (shape === 'bowl') inner = `<path d="M86 244 L214 244 L198 298 L102 298 Z" fill="${p.fill}"></path><path d="M86 244 L214 244 L198 298 L102 298 Z" fill="url(#hmSheen)"></path><ellipse cx="150" cy="244" rx="64" ry="9" fill="#FFFFFF" fill-opacity=".35"></ellipse>`;
  else if (shape === 'pouch') inner = `<path d="M104 162 L196 162 L200 290 Q 150 304 100 290 Z" fill="${p.fill}"></path><path d="M104 162 L196 162 L200 290 Q 150 304 100 290 Z" fill="url(#hmSheen)"></path><rect x="104" y="162" width="92" height="10" fill="#0B0B0C" fill-opacity=".3"></rect><rect x="122" y="204" width="56" height="50" fill="#F7F6F2"></rect>${L(232,6,2)}`;
  else if (shape === 'card') inner = `<rect x="78" y="128" width="144" height="170" fill="url(#hmPorc)"></rect><rect x="78" y="128" width="144" height="36" fill="${p.fill}"></rect><text x="92" y="151" font-family="IBM Plex Mono" font-size="7" letter-spacing="2" fill="#FFFFFF">PASSAGE</text><text x="92" y="196" font-family="IBM Plex Mono" font-size="6" letter-spacing="1.5" fill="#5E5E5B">SIN → ICN</text><line x1="92" y1="210" x2="208" y2="210" stroke="#0B0B0C" stroke-opacity=".2" stroke-dasharray="3 3"></line><text x="92" y="232" font-family="IBM Plex Sans KR" font-weight="600" font-size="9" fill="#0B0B0C">HAEMUN</text><rect x="186" y="256" width="22" height="22" fill="#C1272D"></rect>`;
  return `<svg viewBox="0 0 300 400" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect x="0" y="0" width="300" height="400" fill="url(#hmLight)"></rect><rect x="0" y="292" width="300" height="108" fill="url(#hmFloor)"></rect><ellipse cx="150" cy="299" rx="82" ry="9" fill="url(#hmShadow)"></ellipse>${inner}</svg>`;
}

// Real uploaded photo wins over the drawn placeholder illustration.
function mediaHtml(p, label = true) {
  if (p.photo) return `<img src="${esc(p.photo)}" alt="${esc(p.name || '')}" style="width:100%;height:100%;object-fit:cover;display:block">`;
  return shapeSvg(p, label);
}

function svgDefs() {
  return `<svg width="0" height="0" aria-hidden="true" style="position:absolute"><defs>
  <radialGradient id="hmLight" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
  <linearGradient id="hmFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B0B0C" stop-opacity=".08"/><stop offset="1" stop-color="#0B0B0C" stop-opacity="0"/></linearGradient>
  <linearGradient id="hmPorc" x1="0" x2="1"><stop offset="0" stop-color="#D9D8D2"/><stop offset=".38" stop-color="#FBFAF7"/><stop offset=".7" stop-color="#EEEDE8"/><stop offset="1" stop-color="#C8C7C1"/></linearGradient>
  <linearGradient id="hmCap" x1="0" x2="1"><stop offset="0" stop-color="#050506"/><stop offset=".4" stop-color="#3A3A3D"/><stop offset=".62" stop-color="#18181A"/><stop offset="1" stop-color="#000000"/></linearGradient>
  <linearGradient id="hmSheen" x1="0" x2="1"><stop offset="0" stop-color="#000000" stop-opacity=".28"/><stop offset=".32" stop-color="#FFFFFF" stop-opacity=".22"/><stop offset=".48" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity=".32"/></linearGradient>
  <radialGradient id="hmShadow"><stop offset="0" stop-color="#0B0B0C" stop-opacity=".3"/><stop offset="1" stop-color="#0B0B0C" stop-opacity="0"/></radialGradient>
  </defs></svg>`;
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
    <button class="p-img" style="height:${h}px;background:${p.bg}" data-action="openProduct" data-id="${p.id}">
      ${mediaHtml(p)}
      ${num}
      <span class="cap ov-tr">${v.tag}</span>
      <span class="p-alt">${esc(p.teaser)}</span>
    </button>
    <div class="p-info">
      <span class="p-name">${esc(p.name)}</span><span class="p-price">${v.priceLabel}</span>
      <span class="muted">${esc(p.ko)}</span><span class="muted small right">${v.priceNote}</span>
      <span class="p-meta">${dotHtml(v.dotColor)}${v.catLabel} · ${esc(p.origin)}</span>
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

function postCard(j, t, h, big = false) {
  const pr = j.product ? PRODUCTS.find((p) => p.id === j.product) : null;
  const look = pr || j;
  return `<button class="post-card" data-action="openArticle" data-id="${j.id}">
    <span class="post-img" style="height:${h}px;background:${look.bg}">${mediaHtml(look, false)}</span>
    <span class="cap post-meta"><span class="flex-c">${dotHtml(CAT_COLOR[j.cat] || '#C1272D')}${t.cats[j.cat]}</span><span>${j.date}</span><span>${j.read}</span></span>
    <span class="post-title" style="font-size:${big ? '40px' : '20px'};font-weight:${big ? 300 : 500}">${esc(j.title[state.lang])}</span>
    <span class="post-dek">${esc(j.dek[state.lang])}</span>
  </button>`;
}

function header(t) {
  const nav = (view, label) => `<button class="tlink" data-action="nav" data-view="${view}" style="${navStyle(view)}">${label}</button>`;
  return `
  <div class="cap annbar"><span>${t.ann1}</span><span class="sep">·</span><span>${t.ann2}</span></div>
  <header class="site-header">
    <nav class="hnav">
      ${nav('volume', t.volume)}${nav('mall', t.shopAll)}${nav('journal', t.journal)}${nav('about', t.about)}
    </nav>
    <button class="logo" data-action="nav" data-view="volume">
      <span class="seal">海門</span><span class="wordmark">HAEMUN</span>
    </button>
    <div class="htools">
      <button class="tlink" data-action="toggleTrade" style="${navStyle(state.b2b ? '__b2b' : '')}">${t.trade}</button>
      <span class="lang"><button class="tlink" data-action="setLang" data-lang="en" style="${navStyle(state.lang === 'en' ? '__lang' : '')}">EN</button><span class="sep">/</span><button class="tlink" data-action="setLang" data-lang="ko" style="${navStyle(state.lang === 'ko' ? '__lang' : '')}">한</button></span>
      <button class="tlink bagbtn" data-action="openCart">${t.bag} <span class="bagcount">${cartCount()}</span></button>
    </div>
  </header>
  ${state.b2b ? `<div class="tradebar"><span>${t.tradeNote}</span><span class="muted2">FOB INCHEON · DDP SINGAPORE</span></div>` : ''}`;
}
function navStyle(view) {
  const active = view === state.view || view === '__b2b' && state.b2b || view === '__lang';
  return active ? 'color:#0B0B0C;text-decoration:underline;text-underline-offset:8px' : 'color:#7A7A78';
}
function cartCount() { return Object.values(state.cart).reduce((a, b) => a + b, 0); }

function homeHtml(t) {
  const volProducts = PRODUCTS.filter((p) => p.vol);
  const catTiles = CATS.map((c, i) => {
    const f = PRODUCTS.find((p) => p.cat === c && p.vol) || PRODUCTS.find((p) => p.cat === c);
    const img = f ? `<span class="cat-img" style="height:420px;background:${f.bg}">${mediaHtml(f, false)}<span class="cap ov-tl">0${i + 1}</span></span>` : `<span class="cat-img" style="height:420px;background:#ECECE9"><span class="cap ov-tl">0${i + 1}</span></span>`;
    return `<button class="cat-tile" data-action="goCat" data-cat="${c}">
      ${img}
      <span class="cat-row"><span class="flex-c" style="font-size:14px;font-weight:500">${dotHtml(CAT_COLOR[c])}${t.cats[c]}</span><span class="mono small muted">${String(PRODUCTS.filter((p) => p.cat === c).length).padStart(2, '0')} →</span></span>
      <span class="cat-ko">${t.catDesc[c]}</span>
    </button>`;
  }).join('');
  const posts = POSTS.slice(0, 3).map((j) => postCard(j, t, 360)).join('');
  return `
  <section class="hero">
    <figure class="hero-img">
      <div class="jar-wrap">
        <svg viewBox="0 0 700 760" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <rect x="0" y="0" width="700" height="760" fill="#CFCFCB"/><rect x="0" y="0" width="700" height="760" fill="url(#hmLight)"/>
          <rect x="0" y="520" width="700" height="240" fill="#BDBDB8"/><rect x="0" y="520" width="700" height="1" fill="#A9A9A4"/>
          <ellipse cx="350" cy="544" rx="190" ry="16" fill="url(#hmShadow)"/>
          <path d="M308 278 L392 278 L396 296 C 490 310, 528 390, 520 450 C 512 508, 454 540, 400 544 L300 544 C 246 540, 188 508, 180 450 C 172 390, 210 310, 304 296 Z" fill="url(#hmPorc)"/>
          <path d="M304 296 C 210 310, 172 390, 180 450 C 188 508, 246 540, 300 544 L 325 544 C 260 520, 220 480, 222 430 C 226 370, 260 320, 320 298 Z" fill="#DDDCD6" fill-opacity=".6"/>
        </svg>
        <span class="cap ov-tl">HM / VOL.01 / 000</span>
      </div>
      <figcaption class="cap-row"><span>${t.cap1}</span><span class="muted">Seoul, 2026</span></figcaption>
    </figure>
    <div class="hero-panel">
      <div class="hero-top"><span>VOLUME 01</span><span>AUTUMN 2026</span></div>
      <div>
        <div class="cap" style="color:#C1272D">${t.volTag}</div>
        <div class="hero-h1">${esc(t.h1)}</div>
        <p class="hero-sub">${esc(t.sub)}</p>
      </div>
      <div class="hero-btns">
        <button class="btn-solid cap" data-action="scrollHint">${t.seeVol} ↓</button>
        <button class="btn-outline cap" data-action="goCat" data-cat="all">${t.enterMall} →</button>
      </div>
    </div>
  </section>

  <section class="sec">
    ${sechead('01', t.volTitle, t.volSub, 'goCat', t.shopAll)}
    <div class="grid3" style="margin-top:40px">${volProducts.map((p) => cardHtml(p, t, 600)).join('')}</div>
  </section>

  <section class="sec">
    ${sechead('02', t.catH, t.catSub, 'goCat', t.enterMall)}
    <div class="grid5" style="margin-top:40px">${catTiles}</div>
  </section>

  <section class="sec">
    ${sechead('03', t.jH, t.jSub, 'nav-journal', t.jAll)}
    <div class="grid3" style="margin-top:40px">${posts}</div>
  </section>

  <section class="sec">
    ${sechead('04', t.houseEyebrow, t.houseSub, 'nav-about', t.aboutMore)}
    <div class="house-grid" style="margin-top:40px">
      <div class="house-panel">
        <div class="house-word">해문</div>
        <span class="seal-sq"></span>
        <span class="cap ov-tl muted2">海門 · SEA GATE</span>
      </div>
      <div class="house-text">
        <div>
          <div class="house-h">${esc(t.houseH)}</div>
          <p class="house-b">${esc(t.houseB)}</p>
          <button class="btn-outline-dark cap" data-action="nav-about">${t.aboutMore} →</button>
        </div>
        <div class="house-stats">
          <div><div class="stat-n">05</div><div class="stat-l">${t.statA}</div></div>
          <div><div class="stat-n">100%</div><div class="stat-l">${t.statB}</div></div>
        </div>
      </div>
    </div>
  </section>`;
}

function mallHtml(t) {
  let mall = PRODUCTS.filter((p) => (state.cat === 'all' || p.cat === state.cat) && (state.origin === 'all' || region(p.origin) === state.origin));
  if (state.sort === 'low') mall = mall.slice().sort((a, b) => a.price - b.price);
  if (state.sort === 'high') mall = mall.slice().sort((a, b) => b.price - a.price);
  const mallTitle = state.cat === 'all' ? t.shopAll : t.cats[state.cat];
  const catFilters = ['all'].concat(CATS).map((c) => {
    const count = String(PRODUCTS.filter((p) => c === 'all' || p.cat === c).length).padStart(2, '0');
    const active = state.cat === c;
    return `<button class="filter-row" data-action="setCat" data-cat="${c}" style="${active ? 'color:#0B0B0C;font-weight:500' : 'color:#7A7A78'}">
      <span class="flex-c">${c === 'all' ? '<span class="dot" style="background:transparent"></span>' : dotHtml(CAT_COLOR[c])}${c === 'all' ? t.shopAll : t.cats[c]}</span><span class="mono small">${count}</span>
    </button>`;
  }).join('');
  const originList = ['all'].concat([...new Set(PRODUCTS.map((p) => region(p.origin)))]);
  const origins = originList.map((o) => `<button class="origin-chip" data-action="setOrigin" data-origin="${o}" style="${state.origin === o ? 'border-color:#0B0B0C;background:#0B0B0C;color:#FFFFFF' : 'border-color:#E0E0DD;background:transparent;color:#0B0B0C'}">${o === 'all' ? t.all : o}</button>`).join('');
  const sorts = [['feat', t.sNew], ['low', t.sLow], ['high', t.sHigh]].map(([id, label]) => `<button class="tlink" data-action="setSort" data-sort="${id}" style="${state.sort === id ? 'color:#0B0B0C;text-decoration:underline' : 'color:#7A7A78'}">${label}</button>`).join('');
  const medNote = state.cat === 'medical' ? `<div class="med-note"><span>${t.medNote}</span><span class="cap" style="color:#2E6B5E">${t.medTag}</span></div>` : '';
  const items = mall.length ? mall.map((p) => cardHtml(p, t, 460, { number: false })).join('') : `<div class="empty">${t.none}</div>`;
  return `
  <section class="sec-tight">
    <div class="cap muted">HAEMUN / ${t.shop} / ${mallTitle}</div>
    <div class="shop-head">
      <div class="flex-b"><span class="shop-title">${mallTitle}</span><span class="mono muted">${String(mall.length).padStart(2, '0')} ${t.objects}</span></div>
      <div class="sort-row"><span class="muted">${t.sort}</span>${sorts}</div>
    </div>
  </section>
  <section class="shop-layout">
    <aside class="shop-side">
      <div class="side-h">${t.category}</div>
      ${catFilters}
      <div class="side-h" style="margin-top:32px">${t.origin}</div>
      <div class="origin-wrap">${origins}</div>
      <button class="link-btn muted" data-action="clearFilters" style="margin-top:20px">${t.clear}</button>
    </aside>
    <div>
      ${medNote}
      <div class="grid3-56">${items}</div>
    </div>
  </section>`;
}

function journalHtml(t) {
  const jposts = POSTS.filter((j) => state.jcat === 'all' || j.cat === state.jcat);
  const jFilters = ['all'].concat(CATS).map((c) => `<button class="tlink" data-action="setJcat" data-jcat="${c}" style="${state.jcat === c ? 'color:#0B0B0C;text-decoration:underline' : 'color:#7A7A78'}">${c === 'all' ? t.all : t.cats[c]}</button>`).join('');
  const featured = jposts[0];
  const rest = jposts.slice(1);
  const featuredHtml = featured ? `
  <section class="featured">
    <button class="feat-img" style="background:${(PRODUCTS.find((p) => p.id === featured.product) || featured).bg}" data-action="openArticle" data-id="${featured.id}">${mediaHtml(PRODUCTS.find((p) => p.id === featured.product) || featured, false)}</button>
    <div class="feat-text">
      <div class="cap flex-c" style="gap:14px;color:#7A7A78"><span style="color:#C1272D">${t.featuredLabel}</span><span>${t.cats[featured.cat]}</span><span>${featured.date}</span></div>
      <div class="feat-title">${esc(featured.title[state.lang])}</div>
      <p class="feat-dek">${esc(featured.dek[state.lang])}</p>
      <button class="btn-outline-dark cap" data-action="openArticle" data-id="${featured.id}">${t.readStory} · ${featured.read}</button>
    </div>
  </section>` : '';
  return `
  <section class="sec-tight">
    <div class="cap muted">HAEMUN / ${t.journal}</div>
    <div class="shop-head">
      <div class="flex-b" style="align-items:baseline;gap:16px"><span class="shop-title">${t.journal}</span><span class="muted">${t.jIntro}</span></div>
      <div class="sort-row">${jFilters}</div>
    </div>
  </section>
  ${featuredHtml}
  <section class="sec-tight" style="margin-top:96px">
    <div class="grid3" style="padding-top:24px;border-top:1px solid #E6E6E3">${rest.map((j) => postCard(j, t, 340)).join('')}</div>
  </section>`;
}

function articleHtml(t, post) {
  const pr = post.product ? PRODUCTS.find((p) => p.id === post.product) : null;
  const productBlock = pr ? `
  <div class="art-product-wrap">
    <div class="art-product">
      <span class="art-p-img" style="background:${pr.bg}">${mediaHtml(pr, false)}</span>
      <div><div class="cap muted">${t.inStory}</div><div style="margin-top:8px;font-size:16px;font-weight:500">${esc(pr.name)}</div><div style="margin-top:4px;font-size:13px;color:#5E5E5B">${sgd(pr.price)}</div></div>
      <button class="btn-outline-dark cap" data-action="openProduct" data-id="${pr.id}">${t.view} →</button>
    </div>
  </div>` : '';
  return `
  <article class="art">
    <button class="tlink cap" data-action="nav" data-view="journal">← ${t.journal}</button>
    <div class="art-head">
      <div class="cap flex-c" style="justify-content:center;gap:16px;color:#7A7A78"><span class="flex-c">${dotHtml(CAT_COLOR[post.cat] || '#C1272D')}${t.cats[post.cat]}</span><span>${post.date}</span><span>${post.read}</span></div>
      <h1 class="art-title">${esc(post.title[state.lang])}</h1>
      <p class="art-dek">${esc(post.dek[state.lang])}</p>
    </div>
    <div class="art-hero" style="background:${(pr || post).bg}">${mediaHtml(pr || post, false)}</div>
    <div class="art-body">
      <div class="cap art-byline">${t.by}<br><span style="color:#0B0B0C">${esc(post.author)}</span></div>
      <div class="art-text">${post.paras.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    </div>
    ${productBlock}
  </article>`;
}

function aboutHtml(t) {
  const catRows = CATS.map((c, i) => {
    const f = PRODUCTS.find((p) => p.cat === c && p.vol) || PRODUCTS.find((p) => p.cat === c);
    return `<button class="about-row" data-action="goCat" data-cat="${c}">
      <span class="mono small muted">0${i + 1}</span>
      <span class="flex-c" style="font-size:28px;font-weight:300">${dotHtml(CAT_COLOR[c])}${t.cats[c]}</span>
      <span class="about-desc">${t.catDesc[c]}</span>
      <span class="mono small muted" style="justify-self:end">${String(PRODUCTS.filter((p) => p.cat === c).length).padStart(2, '0')} →</span>
    </button>`;
  }).join('');
  const steps = t.how.map(([n, h, b]) => `<div class="step"><div class="step-n">${n}</div><div class="step-h">${h}</div><p class="step-b">${b}</p></div>`).join('');
  const facts = t.facts.map(([k, v]) => `<div class="fact"><span class="cap muted">${k}</span><span>${v}</span></div>`).join('');
  return `
  <section class="sec-tight">
    <div class="cap muted">HAEMUN / ${t.about}</div>
    <div class="about-hero">
      <div class="about-h1">${esc(t.aboutH)}</div>
      <div class="about-lede">${esc(t.aboutLede)}</div>
    </div>
  </section>
  <section class="about-story">
    <div class="about-panel"><div class="about-word">海門</div><span class="seal-sq" style="right:24px;bottom:24px"></span></div>
    <div class="about-paras">${t.aboutParas.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
  </section>
  <section class="sec">
    ${sechead('01', t.aCarry, t.aCarrySub)}
    <div style="margin-top:24px">${catRows}</div>
  </section>
  <section class="sec">
    ${sechead('02', t.aHow, t.aHowSub)}
    <div class="grid4" style="margin-top:40px">${steps}</div>
  </section>
  <section class="sec">
    ${sechead('03', t.aCo, t.aCoSub)}
    <div class="co-grid" style="margin-top:40px">
      <div class="facts">${facts}</div>
      <div class="trade-box">
        <div><div class="cap" style="color:#C1272D">${t.trade}</div><div style="margin-top:16px;font-size:28px;font-weight:300">${t.tradeH}</div><p style="margin:16px 0 0;font-size:13px;line-height:1.75;color:#4A4A48">${t.tradeB}</p></div>
        <button class="btn-outline-dark cap" data-action="enableTrade">${t.tradeCta} →</button>
      </div>
    </div>
  </section>`;
}

function routeAndFooter(t) {
  return `
  <section class="route">
    <div class="route-grid">
      <span class="dashline"></span>
      ${t.pr.map(([n, h, b], i) => `
        <div class="route-item">
          <span class="pin" style="${i === 1 ? 'border:1px solid #FFFFFF;background:#0B0B0C' : 'background:' + (i === 0 ? '#C1272D' : '#FFFFFF')}"></span>
          <div class="route-hn"><span class="route-h">${h}</span><span class="mono small muted">${n}</span></div>
          <div class="route-b">${b}</div>
        </div>`).join('')}
    </div>
  </section>
  <footer class="site-footer">
    <div class="f-col f-brand"><div class="f-word">HAEMUN 해문</div><div class="muted">${t.footer}</div></div>
    <div class="f-col"><div class="f-h">${t.shop}</div>${CATS.map((c) => `<button class="tlink f-link" data-action="goCat" data-cat="${c}">${t.cats[c]}</button>`).join('')}</div>
    <div class="f-col"><div class="f-h">${t.fHouse}</div><button class="tlink f-link" data-action="nav" data-view="journal">${t.journal}</button><button class="tlink f-link" data-action="nav" data-view="about">${t.about}</button><button class="tlink f-link" data-action="enableTrade">${t.trade}</button></div>
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
  const rows = state.tab === 'form' ? raw.form : state.tab === 'prov' ? raw.prov : comp.concat([['Importer', 'Haemun Pte. Ltd., Singapore']]);
  const tabs = [['form', t.tabF], ['prov', t.tabP], ['spec', t.tabS]].map(([id, label]) => `<button class="tlink" data-action="setTab" data-tab="${id}" style="${state.tab === id ? 'color:#0B0B0C;text-decoration:underline' : 'color:#7A7A78'}">${label}</button>`).join('');
  const qtyBlock = svc ? '' : `<div class="qty"><button data-action="qty" data-delta="-1">−</button><span class="mono">${state.qty}</span><button data-action="qty" data-delta="1">+</button></div>`;
  const gallery = raw.gallery || [];
  const mainImg = gallery.length ? `<img src="${esc(gallery[state.photoIdx] || gallery[0])}" alt="${esc(raw.name)}" style="width:100%;height:100%;object-fit:cover;display:block">` : mediaHtml(raw);
  const thumbs = gallery.length > 1 ? `<div class="pdp-thumbs">${gallery.map((src, i) => `<button class="pdp-thumb" data-action="setPhoto" data-idx="${i}" style="${i === state.photoIdx ? 'border-color:#0B0B0C' : 'border-color:transparent'}"><img src="${esc(src)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></button>`).join('')}</div>` : '';
  return `
  <div class="modal-backdrop pdp">
    <div class="pdp-img" style="background:${raw.bg}">${mainImg}<span class="cap ov-tl">${v.no}</span>${thumbs}</div>
    <div class="pdp-body">
      <div class="pdp-top"><span class="cap muted">${t.shop} / ${v.catLabel}</span><button class="tlink" data-action="closeProduct">${t.close} ✕</button></div>
      <div class="pdp-origin flex-c">${dotHtml(v.dotColor)}${raw.origin}</div>
      <h1 class="pdp-name">${esc(raw.name)}</h1>
      <div class="pdp-ko">${esc(raw.ko)}</div>
      <div class="pdp-price-row"><span class="pdp-price">${v.priceLabel}</span><span class="cap muted">${v.priceNote} · ${raw.cat === 'beauty' || raw.cat === 'wellness' ? 'HSA NOTIFIED' : raw.cat === 'pet' ? 'AVS CLEARED' : raw.cat === 'medical' ? 'BY CONSULTATION' : 'MADE IN KOREA'}</span></div>
      <div class="pdp-tabs">${tabs}</div>
      <div class="pdp-rows">${rows.map(([k, val]) => `<div class="pdp-row"><span class="mono small muted">${k}</span><span>${val}</span></div>`).join('')}</div>
      <div class="pdp-cta">
        ${qtyBlock}
        <button class="btn-solid" data-action="addActive"><span>${addLabel}</span><span class="mono">${lineTotal}</span></button>
      </div>
    </div>
  </div>`;
}

function cartHtml(t) {
  const lines = Object.keys(state.cart).map((id) => {
    const p = PRODUCTS.find((x) => x.id === id), q = state.cart[id];
    return `<div class="cart-line">
      <div class="cart-thumb" style="background:${p.bg}"></div>
      <div><div style="font-weight:500">${esc(p.name)}</div><div class="muted">${p.origin}</div>
        <div class="qty" style="margin-top:10px"><button data-action="cartQty" data-id="${id}" data-delta="-1">−</button><span class="mono">${q}</span><button data-action="cartQty" data-id="${id}" data-delta="1">+</button></div>
      </div>
      <span style="font-weight:500">${sgd(p.price * q)}</span>
    </div>`;
  }).join('');
  const sub = Object.keys(state.cart).reduce((a, id) => a + PRODUCTS.find((x) => x.id === id).price * state.cart[id], 0);
  return `
  <div class="modal-backdrop cart-backdrop">
    <button class="cart-scrim" data-action="closeCart" aria-label="Close"></button>
    <aside class="cart-panel">
      <div class="cart-head"><span class="cap">${t.bag} (${cartCount()})</span><button class="tlink" data-action="closeCart">${t.close} ✕</button></div>
      <div class="cart-lines">${lines || `<div class="muted" style="padding:40px 0">${t.empty}</div>`}</div>
      <div class="cart-foot">
        <div class="flex-b" style="font-size:14px;font-weight:500"><span>${t.subtotal}</span><span>${sgd(sub)}</span></div>
        <div class="muted" style="margin-top:6px">${t.gst}</div>
        <button class="btn-solid cap" style="width:100%;margin-top:20px">${t.checkout}</button>
      </div>
    </aside>
  </div>`;
}

function render() {
  const t = T[state.lang];
  let body = '';
  if (state.view === 'volume') body = homeHtml(t);
  else if (state.view === 'mall') body = mallHtml(t);
  else if (state.view === 'journal') body = journalHtml(t);
  else if (state.view === 'article') {
    const post = POSTS.find((j) => j.id === state.postId);
    body = post ? articleHtml(t, post) : journalHtml(t);
  } else if (state.view === 'about') body = aboutHtml(t);

  document.getElementById('app').innerHTML = `
    ${svgDefs()}
    ${header(t)}
    ${body}
    ${routeAndFooter(t)}
    ${pdpHtml(t)}
    ${state.cartOpen ? cartHtml(t) : ''}
  `;
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (a === 'nav') go({ view: el.dataset.view, postId: null });
  else if (a === 'nav-journal') go({ view: 'journal', postId: null });
  else if (a === 'nav-about') go({ view: 'about' });
  else if (a === 'goCat') go({ view: 'mall', cat: el.dataset.cat, origin: 'all' });
  else if (a === 'openArticle') go({ view: 'article', postId: el.dataset.id });
  else if (a === 'openProduct') setState({ activeId: el.dataset.id, qty: 1, tab: 'form', photoIdx: 0 });
  else if (a === 'setPhoto') setState({ photoIdx: Number(el.dataset.idx) });
  else if (a === 'quick') {
    const p = PRODUCTS.find((x) => x.id === el.dataset.id);
    if (p.service || state.b2b) setState({ activeId: p.id, qty: state.b2b && !p.service ? p.moq : 1, tab: p.service ? 'form' : 'spec', photoIdx: 0 });
    else { addToCart(p.id, 1); setState({ cartOpen: true }); }
  }
  else if (a === 'closeProduct') setState({ activeId: null });
  else if (a === 'setTab') setState({ tab: el.dataset.tab });
  else if (a === 'qty') {
    const raw = PRODUCTS.find((p) => p.id === state.activeId);
    const step = state.b2b && !raw.service ? raw.moq : 1;
    setState({ qty: Math.max(step, state.qty + Number(el.dataset.delta) * step) });
  }
  else if (a === 'addActive') {
    const raw = PRODUCTS.find((p) => p.id === state.activeId);
    if (raw.service || state.b2b) setState({ activeId: null });
    else { addToCart(raw.id, state.qty); setState({ activeId: null, cartOpen: true }); }
  }
  else if (a === 'openCart') setState({ cartOpen: true });
  else if (a === 'closeCart') setState({ cartOpen: false });
  else if (a === 'cartQty') addToCart(el.dataset.id, Number(el.dataset.delta));
  else if (a === 'setCat') setState({ cat: el.dataset.cat });
  else if (a === 'setOrigin') setState({ origin: el.dataset.origin });
  else if (a === 'setSort') setState({ sort: el.dataset.sort });
  else if (a === 'clearFilters') setState({ cat: 'all', origin: 'all', sort: 'feat' });
  else if (a === 'setJcat') setState({ jcat: el.dataset.jcat });
  else if (a === 'toggleTrade') setState({ b2b: !state.b2b });
  else if (a === 'enableTrade') { setState({ b2b: true }); window.scrollTo(0, 0); }
  else if (a === 'setLang') setState({ lang: el.dataset.lang });
  else if (a === 'scrollHint') window.scrollTo({ top: 980, behavior: 'smooth' });
});

render();
loadProducts().then(render);
