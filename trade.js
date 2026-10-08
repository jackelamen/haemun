/* Haemun Trade: a demo wholesale portal for curated products, for offline
   (physical) retail only. Prices and terms are illustrative drafts. */
const TRADE = {
  cat: 'all', qty: {}, sent: false, applied: false, faq: 0, auth: false,
  minFirst: 3000, minReorder: 1500, freeShip: 6000, shipFee: 150, gst: 0.09, minPieces: 4,
  // Per piece: the minimum order (units) and the step above it (one carton).
  moq: { beauty: 24, fashion: 12, wellness: 48, pet: 24 },
  cases: { beauty: 6, fashion: 3, wellness: 12, pet: 6 },
  tiers: [[0, 0, 'Standard'], [150, 0.05, 'Growing'], [400, 0.10, 'Flagship']],
};
const trCats = () => CATS.filter((c) => c !== 'medical' && PRODUCTS.some((p) => p.cat === c));
const trItems = () => PRODUCTS.filter((p) => p.cat !== 'medical' && !p.service);
const trCase = (p) => TRADE.cases[p.cat] || 6;
const trMoq = (p) => TRADE.moq[p.cat] || 24;
const trBase = (p) => Math.round((p.price / (1 + TRADE.gst)) * 0.5 * 100) / 100;
const trTier = (units) => TRADE.tiers.filter((t) => units >= t[0]).pop();
function trOrder() {
  const lines = trItems().filter((p) => TRADE.qty[p.id]).map((p) => ({ p, n: TRADE.qty[p.id], base: trBase(p) }));
  const units = lines.reduce((s, l) => s + l.n, 0);
  const gross = lines.reduce((s, l) => s + l.n * l.base, 0);
  const tier = trTier(units);
  const disc = gross * tier[1];
  const net = gross - disc;
  const ship = !lines.length || net >= TRADE.freeShip ? 0 : TRADE.shipFee;
  return { lines, units, gross, tier, disc, net, ship, total: net + ship };
}

const TR_RULES = [
  ['Online exclusivity', 'Haemun is the only online distributor of every brand we carry, for as long as that brand is under contract with us. No one else may sell these products online, trade customers included. This is the promise we make to our makers, and the reason they trust us with their work.', true],
  ['Permanent shops only', 'Trade accounts are for established retailers: a staffed shop, clinic or hotel boutique with fixed premises, regular opening hours and signage. Market stalls, home-based sellers, short-term pop-ups and online-only businesses do not qualify. Every sale happens face to face.'],
  ['No online listings', 'No webstore carts, marketplaces (Shopee, Lazada, Amazon, Qoo10), social or live-stream selling, or delivery apps. You are welcome to photograph and post the products and tell customers they are available in store.'],
  ['No resale to resellers', 'Stock is for sale to the end customer. Passing it to another retailer, distributor or exporter needs our written approval.'],
  ['Recommended retail price', 'We publish an RRP for every piece. Please sell at RRP. Promotions deeper than 15% off need our written OK, so no brand is discounted out of its own market.'],
  ['Product integrity', 'No repackaging, decanting or relabelling. Keep batch codes intact and store each product as its label says.'],
  ['Territory', 'Accounts open in Singapore first. Malaysia, Indonesia, Thailand, Vietnam and the Philippines are open by application, one market at a time.'],
  ['If a brand’s contract ends', 'Exclusivity lasts as long as the brand’s contract with us. If a contract ends or changes, we tell stockists at least 60 days ahead and honour every open order.'],
];
const trCur = () => (PREFIX[STORE_CURRENCY] || 'S$ ').trim();
const TR_TERMS = () => [
  ['Minimum first order', `${trCur()}3,000 ex GST, across at least 4 different pieces`],
  ['Minimum reorder', `${trCur()}1,500 ex GST`],
  ['Minimum per piece', 'Beauty and pet care 24 units, fashion 12, wellness 48. Above the minimum, in cartons of 6, 3 and 12'],
  ['Wholesale price', '50% of ex-GST RRP, so a keystone margin of 50%'],
  ['Volume pricing', '5% off at 150 units per order, 10% off at 400 units'],
  ['Payment', 'First order paid in advance by bank transfer. Net 30 for approved accounts from the third order'],
  ['Delivery', `Delivered to your door, duties paid. Free over ${trCur()}6,000, otherwise ${trCur()}150`],
  ['Lead time', 'In stock: 3 to 5 working days. Made to order: 3 to 6 weeks, confirmed when you order'],
  ['Returns', 'Damaged or incorrect items only, reported within 7 days. Small batches, so we do not take back unsold stock'],
  ['Compliance', 'Every product ships with its ingredient and compliance documents for your records'],
];
const TR_FAQ = [
  ['Who can open a trade account?', 'Established retailers with permanent, staffed premises: boutiques, department and concept stores, pharmacy chains, clinics and spas, and hotel retail. We ask for your business registration, your opening hours and photos of the space. We do not open accounts for market stalls, home-based or online-only sellers.'],
  ['Can I also sell on my own website?', 'Not the products themselves. Online sales are reserved for Haemun while a brand is under contract with us. You can feature the products on your site as “available in store”.'],
  ['Why the online exclusivity?', 'Small Korean makers sign with us because we promise their work will not be discounted across a hundred marketplaces. Keeping online sales in one place protects their prices, and yours.'],
  ['What happens when a piece sells out?', 'Batches are small. A sold-out piece shows its next expected date from the maker. You can reserve it in your next order.'],
  ['Why are the minimums so high?', 'Haemun is built for stores that give a brand real shelf space. Our makers produce in small batches and plan production around committed orders, so we work with retailers who stock each piece in depth rather than a single unit.'],
  ['Can I mix brands and categories in one order?', 'Yes. Each piece has its own minimum, and the first order must cover at least four different pieces and reach the order minimum.'],
  ['Do you offer samples or testers?', 'Approved accounts can request a first-order sampler. Ask us when you apply.'],
  ['How do the medical and clinic services work?', 'Medical travel packages are not wholesale products. Clinics and agents partner with us through a referral programme; mention it when you apply.'],
  ['Is this the live portal?', 'Not yet. This is a preview. Prices and terms are drafts, accounts are not open, and orders submitted here are not sent.'],
];

function tradeRowHtml(p) {
  const c = trCase(p), n = TRADE.qty[p.id] || 0, w = trBase(p), tag = CAT_COLOR[p.cat];
  const stock = p.inStock ? 'In stock · 3–5 days' : 'Made to order · 3–6 weeks';
  return `<div class="trr${n ? ' trr-on' : ''}">
    <div class="trr-img" style="background:${p.bg}">${mediaHtml({ ...p, photo: p.thumb || p.photo })}</div>
    <div class="trr-main">
      <button class="trr-name" data-action="openProduct" data-id="${p.id}">${esc(p.name)}</button>
      <div class="trr-meta">${dotHtml(tag)}${T[state.lang].cats[p.cat]}${p.origin ? ' · ' + esc(p.origin) : ''}${p.vol ? ' · <span class="trr-vol">Vol. 01</span>' : ''}</div>
      <div class="trr-stock ${p.inStock ? '' : 'trr-wait'}">${stock}</div>
    </div>
    <div class="trr-num"><span class="cap muted">Min</span><span>${trMoq(p)}<small class="muted"> +${c}</small></span></div>
    <div class="trr-num"><span class="cap muted">RRP</span><span>${sgd(p.price)}</span></div>
    <div class="trr-num trr-w"><span class="cap muted">Wholesale</span><span>${sgd(w)}</span></div>
    <div class="trr-qty">
      <button data-tr="step" data-id="${p.id}" data-d="-1" aria-label="Remove a carton"${n ? '' : ' disabled'}>−</button>
      <span class="trr-n">${n}</span>
      <button data-tr="step" data-id="${p.id}" data-d="1" aria-label="Add a carton">+</button>
    </div>
  </div>`;
}

function tradeSummaryHtml() {
  const o = trOrder();
  const pct = Math.min(100, (o.net / TRADE.minFirst) * 100);
  const pieces = o.lines.length, ok = o.net >= TRADE.minFirst && pieces >= TRADE.minPieces;
  const next = TRADE.tiers.find((t) => t[0] > o.units);
  return `<aside class="trs" id="tr-summary">
    <div class="cap trs-h">Your order <span class="muted">· preview</span></div>
    ${o.lines.length ? `<ul class="trs-lines">${o.lines.map((l) => `<li><span>${l.n} × ${esc(l.p.name)}</span><span>${sgd(l.n * l.base)}</span></li>`).join('')}</ul>` : '<p class="trs-empty">Add pieces from the order sheet. Each piece starts at its minimum, then goes up by one carton at a time.</p>'}
    <div class="trs-rows">
      <div><span>${o.units} units</span><span>${sgd(o.gross)}</span></div>
      ${o.disc ? `<div class="trs-save"><span>${o.tier[2]} volume pricing (${Math.round(o.tier[1] * 100)}%)</span><span>−${sgd(o.disc)}</span></div>` : ''}
      <div><span>Delivery, duties paid</span><span>${o.ship ? sgd(o.ship) : o.lines.length ? 'Free' : '—'}</span></div>
      <div class="trs-total"><span>Total ex GST</span><span>${sgd(o.total)}</span></div>
    </div>
    ${next && o.units ? `<p class="trs-hint">${next[0] - o.units} more units for ${Math.round(next[1] * 100)}% off the whole order.</p>` : ''}
    <div class="trs-bar"><span style="width:${pct}%"></span></div>
    <p class="trs-min">${ok ? 'Minimum first order reached.' : [o.net < TRADE.minFirst ? `${sgd(TRADE.minFirst - o.net)} to the ${sgd(TRADE.minFirst)} minimum first order` : '', pieces < TRADE.minPieces ? `${TRADE.minPieces - pieces} more ${TRADE.minPieces - pieces === 1 ? 'piece' : 'pieces'} to reach ${TRADE.minPieces} different pieces` : ''].filter(Boolean).join(' · ') + '.'}</p>
    <button class="btn-solid cap" data-tr="send"${ok ? '' : ' disabled'}>Submit order request <span>→</span></button>
    ${TRADE.sent ? '<p class="trs-sent">This is a preview, so nothing was sent. In the live portal, your account manager confirms stock and lead times within one working day.</p>' : ''}
  </aside>`;
}

function tradeHtml(t) {
  const cats = trCats();
  const items = trItems().filter((p) => TRADE.cat === 'all' || p.cat === TRADE.cat);
  return `<div class="tr">
  <section class="tr-hero" style="background-image:linear-gradient(90deg,rgba(11,11,12,.55) 0%,rgba(11,11,12,.25) 55%,rgba(11,11,12,0) 100%),url('assets/trade-hero.jpg')">
    <div class="tr-hero-in">
      <div class="cap tr-kick">Haemun Trade <span class="stamp">Preview</span></div>
      <h1>Korea’s best small makers, in depth on your shelves.</h1>
      <p>Wholesale for established shops, department stores, clinics and hotels in Southeast Asia, limited to the products we curate. Meaningful minimums, a fixed 50% margin, and online exclusivity that protects both the maker and your store.</p>
      <div class="tr-cta"><button class="tr-btn" data-tr="jump" data-to="tr-apply">Apply for an account</button><button class="tr-btn tr-btn-ghost" data-tr="orders">Trade login →</button></div>
    </div>
  </section>
  <nav class="tr-nav"><div class="tr-nav-in">
    ${[['tr-how', 'How it works'], ['tr-sheet', 'Minimums'], ['tr-rules', 'Rules'], ['tr-terms', 'Terms'], ['tr-apply', 'Apply'], ['tr-faq', 'FAQ']].map(([id, l]) => `<button data-tr="jump" data-to="${id}">${l}</button>`).join('')}
    <span class="tr-demo cap">Preview · prices and terms are drafts</span>
  </div></nav>

  <section class="tr-sec" id="tr-how">
    <div class="tr-stats">
      ${[['50%', 'Keystone margin on every piece'], [trCur() + '3,000', 'Minimum first order, ex GST'], ['24+', 'Units minimum per piece'], ['0', 'Online competitors. Haemun is the only online seller']].map(([n, l]) => `<div><span class="tr-stat-n">${n}</span><span>${l}</span></div>`).join('')}
    </div>
    <div class="tr-head"><span class="sec-no">01</span><h2>How it works</h2><p>Four steps, from application to your door.</p></div>
    <ol class="tr-steps">
      ${[['Apply', 'Tell us about your shop or clinic. We check that you run permanent, staffed premises and that Haemun fits the space.'], ['Get approved', 'Within two working days you receive a login, the full catalogue and the brand kits.'], ['Order', 'Use the order sheet. Each piece has its own minimum, then goes up by the carton. Volume pricing applies to the whole order.'], ['Receive', 'Delivered to your door with duties paid, and compliance documents in the box.']].map(([h2, b], i) => `<li><span class="tr-step-n mono small">${String(i + 1).padStart(2, '0')}</span><h3>${h2}</h3><p>${b}</p></li>`).join('')}
    </ol>
    <div class="tr-who">
      <div class="cap muted">Who it is for</div>
      <div class="tr-who-g">${[['Boutiques and concept stores', 'A tight edit of Korean beauty, fashion and wellness your customers cannot find at the mall.'], ['Clinics and spas', 'Take-home skincare and wellness that carries on the treatment, with compliance papers on file.'], ['Hotels and concierge', 'Gifting and retail with a story, packed for travel.'], ['Pharmacies and wellness shops', 'Red ginseng and wellness pieces from named producers, not anonymous imports.']].map(([h2, b]) => `<div><h3>${h2}</h3><p>${b}</p></div>`).join('')}</div>
    </div>
  </section>

  <section class="tr-excl">
    <div class="tr-excl-in">
      <div class="cap tr-excl-k">The one rule everything else follows from</div>
      <h2>We are the only online seller of our brands.</h2>
      <p>Every brand in the shop is under contract with Haemun. While that contract runs, we are their sole online distributor. That is how a small maker keeps its price and its story intact, and how your store keeps the products that make it worth visiting.</p>
      <div class="tr-excl-g">
        <div><span class="tr-yes">You can</span><ul><li>Sell in store, face to face</li><li>Post and promote the products, saying they are available in store</li><li>Use our brand kits and photography</li></ul></div>
        <div><span class="tr-no">You cannot</span><ul><li>Sell online: webstore, marketplace, social or live-stream</li><li>Ship the products to customers</li><li>Pass stock to another reseller without approval</li></ul></div>
      </div>
    </div>
  </section>

  <section class="tr-sec" id="tr-sheet">
    <div class="tr-head"><span class="sec-no">02</span><h2>Minimums and the order sheet</h2><p>Built for stores that stock in depth. Every piece has its own minimum.</p></div>
    <div class="tr-moq">
      <div class="tr-moq-t">
        <div class="trm trm-h cap muted"><span>Category</span><span>Minimum per piece</span><span>Then in cartons of</span></div>
        ${trCats().map((c) => `<div class="trm"><span class="flex-c">${dotHtml(CAT_COLOR[c])}${t.cats[c]}</span><span><b>${TRADE.moq[c]}</b> units</span><span>${TRADE.cases[c]}</span></div>`).join('')}
        <p class="tr-note">First order: at least ${trCur()}3,000 ex GST across four or more different pieces, so the shelf tells a story. Reorders from ${trCur()}1,500.</p>
      </div>
      <div class="tr-lock">
        <div class="cap tr-lock-k">Approved accounts only</div>
        <h3>The full order sheet sits behind a trade login.</h3>
        <p>Live stock, wholesale prices, minimums and lead times for every piece. Apply below, and we will send your login once your account is approved.</p>
        <button class="tr-btn tr-btn-dark" data-tr="orders">Log in to the order sheet →</button>
        <span class="muted small">Preview: opens a demo account</span>
      </div>
    </div>
  </section>

  <section class="tr-sec" id="tr-rules">
    <div class="tr-head"><span class="sec-no">03</span><h2>Rules and restrictions</h2><p>Please read these before you apply. They are the same for every account.</p></div>
    <ol class="tr-rules">${TR_RULES.map(([h2, b, key], i) => `<li class="${key ? 'tr-rule-key' : ''}"><span class="tr-rule-n mono small">${String(i + 1).padStart(2, '0')}</span><div><h3>${h2}</h3><p>${b}</p></div></li>`).join('')}</ol>
  </section>

  <section class="tr-sec" id="tr-terms">
    <div class="tr-head"><span class="sec-no">04</span><h2>Terms at a glance</h2><p>Draft terms. Final terms are agreed when your account opens.</p></div>
    <dl class="tr-terms">${TR_TERMS().map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
  </section>

  <section class="tr-sec" id="tr-apply">
    <div class="tr-head"><span class="sec-no">05</span><h2>Apply for a trade account</h2><p>Free to apply. We reply within two working days.</p></div>
    <div class="tr-apply">
      <div class="tr-apply-side">
        <h3>What we look for</h3>
        <ul><li>A physical shop, clinic, spa or hotel boutique that customers can visit</li><li>A registered business (UEN or equivalent)</li><li>An edit that fits Haemun, so we say no sometimes</li><li>Agreement to the online exclusivity rule</li></ul>
        <p class="muted">Access to the order sheet and wholesale prices will be password protected once accounts open.</p>
      </div>
      ${TRADE.applied ? `<div class="tr-done"><div class="cap">Preview</div><h3>Thank you.</h3><p>In the live portal we would reply within two working days. Nothing was sent from this preview.</p><button class="link-btn" data-tr="reset">Fill in again</button></div>` : `
      <form class="tr-form" data-tr-form>
        <label>Business name<input required name="biz" autocomplete="organization"></label>
        <label>Type of business<select name="type"><option>Boutique or concept store</option><option>Pharmacy or wellness shop</option><option>Clinic or spa</option><option>Hotel retail</option><option>Other physical retail</option></select></label>
        <label>Shop address<input required name="addr" autocomplete="street-address"></label>
        <label>Country<select name="country"><option>Singapore</option><option>Malaysia</option><option>Indonesia</option><option>Thailand</option><option>Vietnam</option><option>Philippines</option></select></label>
        <label>Your name<input required name="name" autocomplete="name"></label>
        <label>Email<input required type="email" name="email" autocomplete="email"></label>
        <label class="tr-wide">Categories you are interested in<input name="cats" placeholder="e.g. beauty, wellness"></label>
        <label class="tr-check tr-wide"><input type="checkbox" required> I understand that Haemun is the sole online distributor of its brands, and that I may not sell them online.</label>
        <button class="btn-solid cap tr-wide" type="submit">Submit application <span>→</span></button>
      </form>`}
    </div>
  </section>

  <section class="tr-sec" id="tr-faq">
    <div class="tr-head"><span class="sec-no">06</span><h2>Questions</h2><p>Anything else, write to us at [EMAIL].</p></div>
    <div class="tr-faq">${TR_FAQ.map(([q, a], i) => `<div class="tr-q${TRADE.faq === i + 1 ? ' open' : ''}"><button data-tr="faq" data-i="${i + 1}"><span>${q}</span><span class="tr-plus">${TRADE.faq === i + 1 ? '−' : '+'}</span></button>${TRADE.faq === i + 1 ? `<p>${a}</p>` : ''}</div>`).join('')}</div>
  </section>
  </div>`;
}

function tradeOrdersHtml(t) {
  const cats = trCats();
  const items = trItems().filter((p) => TRADE.cat === 'all' || p.cat === TRADE.cat);
  if (!TRADE.auth) return `<div class="tr tr-gate">
    <div class="tr-gate-in">
      <div class="cap tr-kick">Haemun Trade <span class="stamp">Preview</span></div>
      <h1>Trade login</h1>
      <p>Wholesale prices and the order sheet are for approved retail accounts.</p>
      <form class="tr-form tr-login" data-tr-login>
        <label class="tr-wide">Account email<input type="email" value="buyer@yourshop.sg" autocomplete="off"></label>
        <label class="tr-wide">Password<input type="password" value="••••••••••" autocomplete="off"></label>
        <button class="btn-solid cap tr-wide" type="submit">Log in <span>→</span></button>
      </form>
      <p class="muted small">Preview only. Passwords are not checked yet, so any entry works.</p>
      <button class="link-btn" data-action="nav" data-view="trade">← Back to Haemun Trade</button>
    </div>
  </div>`;
  return `<div class="tr">
  <div class="tr-acct"><div class="tr-acct-in">
    <button class="link-btn" data-action="nav" data-view="trade">← Haemun Trade</button>
    <span class="tr-acct-mid">Demo Boutique · Singapore · <b>Account approved</b></span>
    <span class="tr-demo cap">Preview · prices and terms are drafts</span>
    <button class="link-btn" data-tr="logout">Log out</button>
  </div></div>
  <section class="tr-sec tr-sec-top">
    <div class="tr-head"><span class="sec-no">TR</span><h2>Order sheet</h2><p>Live from the Haemun catalogue. Wholesale prices exclude GST.</p></div>
    <div class="tr-tiers">
      <span class="cap muted">Volume pricing, applied to the whole order</span>
      ${TRADE.tiers.map((x) => `<span><b>${x[0] ? x[0] + '+ units' : 'Under ' + TRADE.tiers[1][0] + ' units'}</b> ${x[1] ? Math.round(x[1] * 100) + '% off' : 'Standard price'}</span>`).join('')}
    </div>
    <div class="tr-filter">
      ${['all', ...cats].map((c) => `<button class="tr-chip${TRADE.cat === c ? ' on' : ''}" data-tr="cat" data-c="${c}">${c === 'all' ? 'All pieces' : t.cats[c]}</button>`).join('')}
    </div>
    <div class="tr-layout">
      <div class="tr-sheet">
        <div class="trr trr-head cap muted"><span></span><span>Piece</span><span class="trr-num">Min order</span><span class="trr-num">RRP</span><span class="trr-num">Wholesale</span><span class="trr-qty">Units</span></div>
        ${state.loading ? skeletons(4, '4 / 1') : items.length ? items.map(tradeRowHtml).join('') : '<p class="muted" style="padding:32px 0">Nothing in this category yet.</p>'}
        <p class="tr-note">Medical travel packages are services, not wholesale products. Clinics and agents work with us through a referral programme.</p>
      </div>
      ${tradeSummaryHtml()}
    </div>
  </section>
  </div>`;
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-tr]');
  if (!el) return;
  const a = el.dataset.tr;
  if (a === 'jump') { const x = document.getElementById(el.dataset.to); if (x) window.scrollTo({ top: x.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' }); return; }
  if (a === 'orders') { go({ view: 'tradeorders' }); return; }
  if (a === 'logout') { TRADE.auth = false; go({ view: 'trade' }); return; }
  if (a === 'step') {
    const p = findProduct(el.dataset.id); if (!p) return;
    const cur = TRADE.qty[p.id] || 0, d = Number(el.dataset.d);
    let n = d > 0 ? (cur ? cur + trCase(p) : trMoq(p)) : cur - trCase(p);
    if (n < trMoq(p)) n = 0;
    if (n) TRADE.qty[p.id] = n; else delete TRADE.qty[p.id];
    TRADE.sent = false; const y = window.scrollY; render(); window.scrollTo(0, y); return;
  }
  const y = window.scrollY;
  if (a === 'cat') TRADE.cat = el.dataset.c;
  else if (a === 'send') TRADE.sent = true;
  else if (a === 'faq') TRADE.faq = TRADE.faq === Number(el.dataset.i) ? 0 : Number(el.dataset.i);
  else if (a === 'reset') TRADE.applied = false;
  render(); window.scrollTo(0, y);
});
document.addEventListener('submit', (e) => {
  if (!e.target.matches('[data-tr-form]')) return;
  e.preventDefault(); TRADE.applied = true;
  const y = window.scrollY; render(); window.scrollTo(0, y);
});
document.addEventListener('submit', (e) => {
  if (!e.target.matches('[data-tr-login]')) return;
  e.preventDefault(); TRADE.auth = true; render(); window.scrollTo(0, 0);
});
