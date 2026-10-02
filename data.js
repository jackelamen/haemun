const CATS = ['beauty', 'fashion', 'wellness', 'pet', 'medical'];
const CAT_COLOR = { beauty: '#C1272D', fashion: '#0B0B0C', wellness: '#1F3F8C', pet: '#A8742A', medical: '#2E6B5E' };

// The site runs WooCommerce, so real product data lives in WooCommerce's
// own tables, not a plain WordPress post. The Store API is WooCommerce's
// public, no-auth-required endpoint meant for exactly this (a separate
// storefront) — no API keys, no ACF setup needed.
const WP_SITE = 'https://checkout.haemun.com';
// API calls go to /wp-json on this site's own domain, which vercel.json
// forwards to WordPress. Same-origin means no CORS rules to keep in sync
// when the site's domain changes. (Checkout links still use WP_SITE.)
const API_ROOT = location.protocol.startsWith('http') ? '' : WP_SITE;
const WC_STORE_API = API_ROOT + '/wp-json/wc/store/v1';

const decode = (t) => t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, '\u2019').replace(/&#8211;|&ndash;/g, '\u2013').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");
const stripTags = (html) => decode(String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')).trim();

// Splits WooCommerce description HTML into readable blocks, keeping
// paragraph and list-item breaks instead of one wall of text.
function htmlToBlocks(html) {
  return String(html || '')
    .replace(/<li[^>]*>/gi, '\n\u2022 ')
    .replace(/<\/(p|li|h[1-6]|div)>|<br\s*\/?>/gi, '\n')
    .split('\n')
    .map((line) => stripTags(line))
    .filter(Boolean);
}

// Order value (in store currency) above which delivery is free. Set to 0
// to hide the progress line in the bag.
const FREE_SHIP = 120;

// Drop schedule. Seasonal for now: a volume opens on the first of March,
// June, September and December (months are 0-based). To go monthly, set
// DROP_MONTHS to [0,1,2,3,4,5,6,7,8,9,10,11] and update the wording in T.
const DROP_MONTHS = [2, 5, 8, 11];
const VOL1 = { year: 2026, month: 8 }; // Volume 01: Autumn 2026

// The current volume, as shown in the landing-page hero. Its products are
// whichever WooCommerce products carry a tag containing "volume" (currently
// "Volume 01"). To launch a new volume: tag its products, swap these images,
// and bump the number and season.
//   hero.wide / hero.tall  stills for desktop (16:9) and phone (3:4)
//   hero.video / videoTall  muted ambient loop (MP4); leave null until it exists
//   hero.film               full film with sound, opened by "Watch the film"
//   starts                  optional "Start here if..." line per product id;
//                           otherwise the category's line in T.startCat is used
// Placeholder category photos for "Shop by category" on the home page.
// General scenes on purpose, so they don't read as any one volume.
const CAT_IMAGES = {
  beauty: 'assets/categories/beauty.jpg', fashion: 'assets/categories/fashion.jpg', wellness: 'assets/categories/wellness.jpg',
  pet: 'assets/categories/pet.jpg', medical: 'assets/categories/medical.jpg',
};

const VOLUME = {
  no: '01',
  season: { en: 'Autumn 2026', ko: '2026 가을' },
  intro: {
    en: 'Six pieces, one from each category, chosen in person in Korea this autumn. Each is made in a small batch, so when a piece sells out it is gone until its maker makes more.',
    ko: '이번 가을 한국에서 직접 고른, 카테고리마다 하나씩 여섯 가지 제품입니다. 모두 소량 생산이라 품절되면 메이커가 다시 만들 때까지 구할 수 없습니다.',
  },
  hero: {
    wide: 'assets/volumes/vol-01-hero-wide.jpg',
    tall: 'assets/volumes/vol-01-hero-tall.jpg',
    video: null, videoTall: null, film: null, filmLength: '',
  },
  // The volume's theme, shown under the cover on the volume page: a title,
  // a few short paragraphs, and one line per product (by id) on why it fits.
  theme: {
    title: { en: 'The turn of the season', ko: '환절기' },
    paras: {
      en: [
        'Koreans have a word for the weeks when summer gives way to cold: hwanjeolgi, the turn of the season. Skin tightens, joints notice the mornings, and families reach for the things that restore, from a box of red ginseng to a richer oil at night.',
        'Volume 01 is built around that habit. Every piece answers the same question: what helps you, and the ones you look after, come through the change in better shape than you went in?',
      ],
      ko: [
        '여름이 추위로 넘어가는 몇 주를 우리는 환절기라고 부릅니다. 피부가 당기고, 아침 공기가 몸에 먼저 닿고, 가족들은 홍삼 한 상자나 밤에 바르는 진한 오일처럼 몸을 되살리는 것을 찾습니다.',
        '제1호는 그 습관에서 출발했습니다. 모든 제품이 같은 질문에 답합니다. 나와 내가 돌보는 이들이 계절이 바뀐 뒤 더 좋은 상태로 지나가려면 무엇이 필요할까?',
      ],
    },
    why: {
      wc32: { en: 'Ginseng and peony, the classic pairing for skin that has lost its summer bounce.', ko: '여름의 탄력을 잃은 피부를 위한 인삼과 작약의 고전적인 조합.' },
      wc34: { en: 'Camellia was the oil Korean households used against the first dry winds. This is that oil, refined.', ko: '첫 건조한 바람에 한국 가정이 쓰던 동백 오일을 다듬은 것.' },
      wc44: { en: 'Six-year red ginseng is what Korean families give each other when the weather turns.', ko: '날씨가 바뀔 때 한국 가족들이 서로 건네는 6년근 홍삼.' },
      wc42: { en: 'Vegetable-tanned leather darkens and softens with every season. A bag made for the long run.', ko: '계절이 지날수록 짙고 부드러워지는 베지터블 가죽. 오래 함께할 가방.' },
      wc54: { en: 'Cold pavements crack paws too. Herbs and beeswax, the same restoring idea, for the dog.', ko: '차가운 길은 발바닥도 갈라지게 합니다. 같은 회복의 생각을 반려견에게.' },
      wc56: { en: 'The full reset: a few days in Seoul for skin, timed for when the season changes.', ko: '계절이 바뀔 때 맞춘, 서울에서 며칠간의 피부 리셋.' },
    },
  },
  starts: {
    wc34: { en: 'Start here if you want a ritual, not a routine.', ko: '루틴이 아닌 의식을 원한다면 여기서 시작하세요.' },
  },
};

// Currency reported by the store; drives the price prefix site-wide.
let STORE_CURRENCY = 'SGD';
// 'live' once WooCommerce answers, 'failed' if it can't be reached.
let LIVE_STATUS = 'pending';

// Best-effort match from a WooCommerce category name to one of our five
// fixed categories, since WooCommerce's own category list is free-form.
// Falls back to "beauty" if nothing matches.
function guessCat(wcCategories) {
  const names = (wcCategories || []).map((c) => c.name.toLowerCase()).join(' ');
  if (/pet/.test(names)) return 'pet';
  if (/medical|health.?travel|clinic/.test(names)) return 'medical';
  if (/wellness|health|supplement/.test(names)) return 'wellness';
  if (/fashion|apparel|clothing/.test(names)) return 'fashion';
  return 'beauty';
}

// Maps a WooCommerce Store API product into the shape the frontend
// expects. WooCommerce doesn't have fields for our drawn-illustration
// system (shape/bg/fill) or origin/MOQ, so those fall back to sane
// defaults — they're irrelevant anyway once a real photo is present,
// since mediaHtml() always prefers a real photo over the illustration.
function mapWcProduct(p) {
  const minorUnit = p.prices && p.prices.currency_minor_unit != null ? Number(p.prices.currency_minor_unit) : 2;
  const price = p.prices ? Number(p.prices.price) / Math.pow(10, minorUnit) : 0;
  const images = [...new Set((p.images || []).map((img) => img.src).filter(Boolean))];
  return {
    id: 'wc' + p.id,
    vol: (p.tags || []).some((tg) => /volume/i.test(tg.name)),
    cat: guessCat(p.categories),
    shape: 'jar', bg: '#DEDEDA', fill: '#0B0B0C', // unused once `photo` is set
    photo: images[0] || null,
    gallery: images,
    price,
    inStock: p.is_in_stock !== false,
    featured: false, // set by loadProducts from the store's featured list
    name: stripTags(p.name),
    ko: '',
    origin: (p.brands && p.brands[0] && stripTags(p.brands[0].name)) || '',
    moq: 1,
    service: false,
    teaser: stripTags(p.short_description) || htmlToBlocks(p.description).slice(0, 2).join(' ').slice(0, 180),
    desc: htmlToBlocks(p.description || p.short_description),
    form: [],
    prov: [['Category', (p.categories || []).map((c) => c.name).join(', ') || '—']],
  };
}

// Fetches live products from WooCommerce's Store API and replaces the mock
// PRODUCTS array in place (so every other reference to PRODUCTS stays
// valid). Falls back to the mock data below if the request fails or the
// store has no published products yet, so the site never renders blank.
async function loadProducts() {
  if (!WC_STORE_API) return;
  try {
    // Newest first, so list order doubles as "Recent arrivals". The Store API
    // doesn't expose the featured flag on products, only as a filter, so the
    // featured list is fetched alongside.
    const [res, featRes] = await Promise.all([
      fetch(`${WC_STORE_API}/products?per_page=100&orderby=date&order=desc`),
      fetch(`${WC_STORE_API}/products?per_page=100&featured=true`).catch(() => null),
    ]);
    if (!res.ok) throw new Error('WooCommerce Store API request failed: ' + res.status);
    const items = await res.json();
    if (!Array.isArray(items) || !items.length) { LIVE_STATUS = 'empty'; return; }
    const featured = new Set(featRes && featRes.ok ? (await featRes.json()).map((p) => p.id) : []);
    const mapped = items.map((p, i) => ({ ...mapWcProduct(p), arrival: i, featured: featured.has(p.id) }));
    if (items[0].prices && items[0].prices.currency_code) STORE_CURRENCY = items[0].prices.currency_code;
    PRODUCTS.length = 0;
    PRODUCTS.push(...mapped);
    LIVE_STATUS = 'live';
  } catch (err) {
    LIVE_STATUS = 'failed';
    console.error('Haemun: could not load WooCommerce products from ' + WC_STORE_API + ' (' + err.message + '). If this is a CORS error, check the Access-Control rules in functions.php.');
  }
}

// Journal stories come from WordPress posts, the same way products come from
// WooCommerce. A post's featured image becomes the story image, its category
// slug (beauty, fashion, wellness, pet, medical, house) drives the filter, and
// a tag named "product-<WooCommerce id>" links the story to a product. The
// hardcoded POSTS below are the fallback if WordPress has no posts or can't
// be reached.
const WP_API = API_ROOT + '/wp-json/wp/v2';
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function mapWpPost(p) {
  const terms = ((p._embedded && p._embedded['wp:term']) || []).flat();
  const catSlug = (terms.find((tm) => tm.taxonomy === 'category' && (CATS.includes(tm.slug) || tm.slug === 'house')) || {}).slug || 'house';
  const prodTag = terms.find((tm) => tm.taxonomy === 'post_tag' && /^product-\d+$/.test(tm.slug));
  const media = p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0];
  const image = (media && media.source_url) || null;
  const paras = htmlToBlocks(p.content && p.content.rendered);
  const words = paras.join(' ').split(/\s+/).filter(Boolean).length;
  const dt = new Date(p.date);
  const title = stripTags(p.title && p.title.rendered);
  const dek = stripTags(p.excerpt && p.excerpt.rendered);
  return {
    id: 'wp' + p.id,
    cat: catSlug,
    product: prodTag ? 'wc' + prodTag.slug.replace('product-', '') : null,
    image,
    bg: '#E2E1DD', shape: 'card', fill: CAT_COLOR[catSlug] || '#C1272D', // fallback illustration
    date: String(dt.getDate()).padStart(2, '0') + ' ' + MONTHS[dt.getMonth()] + ' ' + dt.getFullYear(),
    read: Math.max(1, Math.round(words / 200)) + ' MIN',
    author: 'Haemun Editors',
    title: { en: title, ko: title },
    dek: { en: dek, ko: dek },
    paras,
  };
}

// Brands come from WooCommerce's Brands taxonomy (Products > Brands). A
// brand's description and image there show on the Brands page; without an
// image, the brand's first product photo is used.
let BRANDS = [];
async function loadBrands() {
  try {
    const res = await fetch(`${WC_STORE_API}/products/brands`);
    if (!res.ok) throw new Error('brands request failed: ' + res.status);
    const items = await res.json();
    BRANDS = (Array.isArray(items) ? items : []).filter((b) => b.count > 0).map((b) => ({
      id: b.id, slug: b.slug, name: stripTags(b.name), count: b.count,
      desc: htmlToBlocks(b.description), image: (b.image && (b.image.src || b.image.thumbnail)) || null,
    }));
  } catch (err) {
    console.error('Haemun: could not load brands (' + err.message + ').');
  }
}

async function loadPosts() {
  try {
    const res = await fetch(`${WP_API}/posts?_embed=wp:featuredmedia,wp:term&per_page=20`);
    if (!res.ok) throw new Error('WordPress posts request failed: ' + res.status);
    const items = await res.json();
    if (!Array.isArray(items) || !items.length) { POSTS_STATUS = 'empty'; return; }
    POSTS.length = 0;
    POSTS.push(...items.map(mapWpPost));
    POSTS_STATUS = 'live';
  } catch (err) {
    POSTS_STATUS = 'failed';
    console.error('Haemun: could not load WordPress posts (' + err.message + ').');
  }
}

// Products and stories load from WooCommerce and WordPress. There is no
// sample fallback: while they load the page shows neutral placeholders,
// and if a request fails it says so instead of showing made-up items.
let PRODUCTS = [];
const POSTS = [];
let POSTS_STATUS = 'pending';
const T = {
  en: { ann1: 'Shipped from Korea to Singapore', ann2: 'Compliance handled for every category',
    volume: 'Volume 01', shop: 'Shop', shopAll: 'Shop all', journal: 'Editorial', about: 'About Haemun', trade: 'Trade', bag: 'Bag',
    cats: { beauty: 'Beauty & Body Care', fashion: 'Fashion', wellness: 'Health & Wellness', pet: 'Premium Pet Care', medical: 'Medical Travel', house: 'The House' },
    catsKo: { beauty: '뷰티 & 바디케어', fashion: '패션', wellness: '헬스 & 웰니스', pet: '프리미엄 펫케어', medical: '메디컬 트래블' },
    catDesc: { beauty: 'Skin, body and hair formulas from independent Korean laboratories.', fashion: 'Clothing and objects made with Korean materials: hanji, ramie, najeon.', wellness: 'Ginseng, hanbang and functional nutrition, HSA notified.', pet: 'Food, care and objects for animals, made to the same standard as ours.', medical: 'Dermatology, screening and recovery in Korea, arranged end to end.' },
    cap1: 'Dalhangari, the moon jar. Empty by design.', volTag: '해문 제1호', h1: 'Korea,\nby sea.',
    sub: 'Every season, Haemun selects Korean makers, ateliers and clinics, and brings their work to Singapore and Southeast Asia.',
    seeVol: 'Shop Volume 01', enterMall: 'Enter the shop',
    volTitle: 'Volume 01: six objects', volSub: 'Autumn 2026 · One from every category',
    catH: 'Shop by category', catSub: 'Five categories, one standard.',
    jH: 'Editorial', jSub: 'Makers, materials and places.', jAll: 'All stories',
    houseEyebrow: 'The house', houseSub: 'Singapore and Seoul', aboutMore: 'About Haemun',
    houseH: 'We work with makers too small for export houses, and too good to stay in Korea.',
    houseB: 'We visit each one, test what they make, handle import and compliance ourselves, then carry it south.',
    statA: 'Categories', statB: 'Direct from Korea',
    tradeNote: 'TRADE VIEW · WHOLESALE PRICES EXCLUDE GST', add: 'Add to bag +', inquire: 'Request batch quote', enquire: 'Request consultation', dossier: 'REQUEST COMPLIANCE DOSSIER',
    rrp: 'incl. GST', wsp: 'Wholesale', from: 'From', perPerson: 'per person', tabF: 'Details', tabP: 'Provenance', tabS: 'Compliance', close: 'Close',
    sort: 'Sort', sNew: 'Featured', sLow: 'Price ↑', sHigh: 'Price ↓', category: 'Category', origin: 'Origin', clear: 'Clear filters', all: 'All', none: 'Nothing matches these filters.', objects: 'items',
    medNote: 'Medical Travel packages are arranged by Haemun and delivered by licensed providers in Korea. Each begins with a consultation request; nothing is booked or charged until you have spoken to the provider.', medTag: 'By consultation',
    jIntro: 'Makers, materials and places.', featuredLabel: 'Featured', readStory: 'Read the story', by: 'Words', inStory: 'In this story', view: 'View',
    aboutH: 'A sea gate.\nA gate to SEA.', aboutLede: 'Hae (海) is Korean for sea. Written in English, it is also SEA: Southeast Asia. Haemun is the gate between Korean makers and the region, across the water that joins them.',
    nameKicker: 'The name', nameDefs: [['海', 'Hae', 'Sea', 'The water between Korea and Southeast Asia, crossed by every shipment we send.'], ['SEA', 'Hae, in English', 'Southeast Asia', 'Read the same sound in English and it names the region we serve, from Singapore outward.'], ['門', 'Mun', 'Gate', 'The way in, for Korean makers reaching the region and for customers reaching Korea.']], nameLine: 'Haemun: a sea gate, and Korea\u2019s gate to SEA.',
    aboutParas: ['해문 (海門), haemun, is the old word for a harbour mouth: the gate between land and open water. We chose it because that is the job, twice over. We stand at the gate between Korean makers and Southeast Asian customers, and make the crossing simple for both.', 'Korea makes some of the most considered products in the world, but many of the best makers are too small to export. They have no one to handle import permits, HSA notification, labelling or logistics.', 'We do that work. We visit every maker, test what they make, publish a small selection each season, and keep the full range in our shop.'],
    aCarry: 'What we carry', aCarrySub: 'Five categories under one standard.',
    aHow: 'How we work', aHowSub: 'From a maker in Korea to a shelf in Singapore.',
    how: [['01', 'Select', 'We visit every maker in person. Fewer than one in twenty are taken on.'], ['02', 'Verify', 'Batches are tested and documented before shipping. Services are reviewed in person.'], ['03', 'Comply', 'HSA, AVS and customs requirements are handled by us, category by category.'], ['04', 'Deliver', 'Shipped by sea to Singapore, then delivered across Southeast Asia.']],
    aCo: 'The company', aCoSub: 'Haemun Pte. Ltd.',
    facts: [['Headquarters', 'Singapore, [ADDRESS]'], ['Sourcing office', 'Seoul, [ADDRESS]'], ['Founded', '[YEAR]'], ['Registration', 'UEN [NUMBER]'], ['Contact', '[EMAIL]']],
    tradeH: 'For retailers, clinics and stockists.', tradeB: 'Trade accounts see wholesale tiers, minimum orders and compliance dossiers across every category.', tradeCta: 'Switch to trade view',
    footer: 'Korea to Singapore, by sea.', fHouse: 'House', fHelp: 'Help', fShip: 'Shipping', fReturns: 'Returns', fContact: 'Contact',
    shipTo: (n) => `You are ${n} away from complimentary delivery.`, shipDone: 'Complimentary delivery unlocked.', pairs: 'Pairs well with', related: 'You may also like', addShort: 'Add +',
    trust: ['Shipped direct from Korea', 'Compliance handled for Singapore', 'Secure checkout · PayNow and card'],
    dropsKicker: 'How the drops work',
    drops: [['01', 'A new volume, every season', 'At the start of each season we publish a new volume: a short edit of what we found in Korea that season.'],
      ['02', 'Small batches, chosen in person', 'Every piece comes from a maker we visited, in the quantity they can make well. When a batch sells out, it is gone until they make more.'],
      ['03', 'Then into the shop', 'When the next volume opens, earlier pieces move to the shop and stay there while stock lasts.']],
    nextDrop: (vol, season, date) => `Volume ${vol}${season ? ' · ' + season : ''} opens ${date}`, seasons: ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter'], daysLeft: (n) => (n === 1 ? '1 day to go' : `${n} days to go`), dropNotes: 'Notes on Volume 01',
    shopIntro: 'Everything we carry, across five categories.', allOrigins: 'All origins', allBrands: 'All brands', liveFail: 'We couldn\u2019t reach the store just now. Please refresh in a moment.', storiesFail: 'We couldn\u2019t load the stories just now. Please refresh in a moment.',
    search: 'Search', searchPh: 'Search products, makers, categories', noResults: 'Nothing found. Try a category or maker name.', brand: 'Brand', demoNote: 'These are sample products and can\u2019t be purchased yet.', toCheckout: 'Taking you to secure checkout\u2026',
    empty: 'Your bag is empty.', subtotal: 'Subtotal', gst: 'Prices include 9% Singapore GST', checkout: 'Proceed to PayNow / Card',
    pr: [['37.56N', 'Seoul', 'Chosen in person. Fewer than one in twenty makers make it.'], ['4,630 KM', 'At sea', 'Batch records and cold-chain data travel with every shipment.'], ['1.35N', 'Singapore', 'Cleared and compliant for its category before anything is listed.']] },
  ko: { ann1: '한국에서 싱가포르로 직송', ann2: '모든 카테고리 규정 준수',
    volume: '제1호', shop: '숍', shopAll: '전체 상품', journal: '에디토리얼', about: '해문 소개', trade: '입점사', bag: '장바구니',
    cats: { beauty: '뷰티 & 바디케어', fashion: '패션', wellness: '헬스 & 웰니스', pet: '프리미엄 펫케어', medical: '메디컬 트래블', house: '하우스' },
    catsKo: { beauty: 'Beauty & Body Care', fashion: 'Fashion', wellness: 'Health & Wellness', pet: 'Premium Pet Care', medical: 'Medical Travel' },
    catDesc: { beauty: '독립 연구실의 스킨, 바디, 헤어 포뮬러.', fashion: '한지, 모시, 나전 등 한국 소재로 만든 옷과 오브젝트.', wellness: '홍삼, 한방, 기능성 영양. HSA 신고 완료.', pet: '사람의 것과 같은 기준으로 만든 반려동물 제품.', medical: '한국의 피부과, 건강검진, 회복 프로그램을 처음부터 끝까지.' },
    cap1: '달항아리. 비워 둔 아름다움.', volTag: 'HAEMUN VOLUME 01', h1: '한국,\n바다 건너.',
    sub: '해문은 매 시즌 한국의 메이커, 아틀리에, 클리닉을 골라 싱가포르와 동남아시아로 전합니다.',
    seeVol: '제1호 쇼핑하기', enterMall: '숍 둘러보기',
    volTitle: '제1호: 여섯 가지 오브젝트', volSub: '2026 가을 · 카테고리마다 하나씩',
    catH: '카테고리별 쇼핑', catSub: '다섯 카테고리, 하나의 기준.',
    jH: '에디토리얼', jSub: '메이커, 소재, 장소.', jAll: '모든 이야기',
    houseEyebrow: '하우스', houseSub: '싱가포르와 서울', aboutMore: '해문 소개',
    houseH: '수출하기엔 너무 작고, 한국에만 두기엔 너무 좋은 메이커와 일합니다.',
    houseB: '직접 방문하고, 검사하고, 수입과 규정 준수를 직접 처리한 뒤 남쪽으로 옮깁니다.',
    statA: '카테고리', statB: '한국 직송',
    tradeNote: '입점사 보기 · 도매가 GST 별도', add: '장바구니 담기 +', inquire: '배치 견적 요청', enquire: '상담 요청', dossier: '규정 준수 자료 요청',
    rrp: 'GST 포함', wsp: '도매가', from: '부터', perPerson: '1인 기준', tabF: '상세', tabP: '원산지', tabS: '규정 준수', close: '닫기',
    sort: '정렬', sNew: '추천순', sLow: '낮은 가격', sHigh: '높은 가격', category: '카테고리', origin: '원산지', clear: '필터 초기화', all: '전체', none: '조건에 맞는 제품이 없습니다.', objects: '품목',
    medNote: '메디컬 트래블 패키지는 해문이 준비하고 한국의 면허 기관이 제공합니다. 모든 패키지는 상담 요청으로 시작하며, 상담 전에는 예약이나 결제가 이루어지지 않습니다.', medTag: '상담 후 예약',
    jIntro: '메이커, 소재, 장소.', featuredLabel: '추천', readStory: '이야기 읽기', by: '글', inStory: '이 이야기 속 제품', view: '보기',
    aboutH: '바다의 문,\nSEA로 가는 문.', aboutLede: '해(海)는 바다입니다. 영어로 읽으면 SEA, 곧 동남아시아(Southeast Asia)이기도 합니다. 해문은 한국의 메이커와 동남아시아를 바다 건너 잇는 문입니다.',
    nameKicker: '이름', nameDefs: [['海', '해', '바다', '한국과 동남아시아 사이, 모든 배송이 건너는 바다.'], ['SEA', '해, 영어로', '동남아시아', '같은 소리를 영어로 읽으면 우리가 일하는 지역, Southeast Asia가 됩니다.'], ['門', '문', '문', '한국 메이커가 동남아시아로, 고객이 한국으로 들어서는 입구.']], nameLine: '해문: 바다의 문, 그리고 SEA로 가는 한국의 문.',
    aboutParas: ['해문(海門)은 항구의 입구, 땅과 바다 사이의 문을 뜻합니다. 두 가지 의미 모두 우리의 일이기에 이 이름을 골랐습니다.', '한국은 세계에서 가장 정성스러운 제품을 만들지만, 좋은 메이커 중 다수는 수출하기에 너무 작습니다.', '해문이 그 일을 합니다. 모든 메이커를 방문하고, 검사하고, 매 시즌 소수를 골라 발행하며, 전체 제품은 숍에 둡니다.'],
    aCarry: '취급 카테고리', aCarrySub: '하나의 기준, 다섯 카테고리.',
    aHow: '일하는 방식', aHowSub: '한국의 메이커에서 싱가포르의 매대까지.',
    how: [['01', '선택', '모든 메이커를 직접 방문합니다. 스무 곳 중 한 곳 미만만 입점합니다.'], ['02', '검증', '배치를 검사하고 기록합니다. 서비스는 직접 확인합니다.'], ['03', '준수', 'HSA, AVS, 통관 요건을 카테고리별로 처리합니다.'], ['04', '배송', '바다로 싱가포르까지, 그리고 동남아시아 전역으로.']],
    aCo: '회사', aCoSub: 'Haemun Pte. Ltd.',
    facts: [['본사', '싱가포르, [주소]'], ['소싱 사무소', '서울, [주소]'], ['설립', '[연도]'], ['등록번호', 'UEN [번호]'], ['문의', '[이메일]']],
    tradeH: '리테일러, 클리닉, 입점사를 위해.', tradeB: '입점사 계정은 모든 카테고리의 도매 단가, 최소 주문량, 규정 준수 자료를 볼 수 있습니다.', tradeCta: '입점사 보기로 전환',
    footer: '한국에서 싱가포르로, 바다 건너.', fHouse: '하우스', fHelp: '도움말', fShip: '배송', fReturns: '반품', fContact: '문의',
    shipTo: (n) => `${n} 더 담으면 무료 배송입니다.`, shipDone: '무료 배송이 적용됩니다.', pairs: '함께 쓰기 좋은 제품', related: '이런 제품은 어떠세요', addShort: '담기 +',
    trust: ['한국에서 직접 배송', '싱가포르 규정 준수 완료', 'PayNow · 카드 안전 결제'],
    dropsKicker: '드롭 방식',
    drops: [['01', '시즌마다 새로운 호', '시즌이 시작될 때마다 그 시즌 한국에서 찾은 제품을 짧게 엮은 새 호를 발행합니다.'],
      ['02', '직접 고른 소량 생산', '모든 제품은 직접 방문한 메이커가 잘 만들 수 있는 만큼만 만듭니다. 배치가 소진되면 다음 생산까지 기다려야 합니다.'],
      ['03', '그다음은 숍으로', '다음 호가 열리면 이전 제품은 숍으로 옮겨져 재고가 있는 동안 판매됩니다.']],
    nextDrop: (vol, season, date) => `제${vol}호${season ? ' · ' + season : ''} ${date} 공개`, seasons: ['겨울', '겨울', '봄', '봄', '봄', '여름', '여름', '여름', '가을', '가을', '가을', '겨울'], daysLeft: (n) => `${n}일 남음`, dropNotes: '제1호 노트 읽기',
    shopIntro: '다섯 카테고리에 걸친 모든 제품.', allOrigins: '모든 원산지', allBrands: '모든 브랜드', liveFail: '지금은 스토어에 연결할 수 없습니다. 잠시 후 새로고침해 주세요.', storiesFail: '지금은 이야기를 불러올 수 없습니다. 잠시 후 새로고침해 주세요.',
    search: '검색', searchPh: '제품, 메이커, 카테고리 검색', noResults: '결과가 없습니다. 카테고리나 메이커 이름으로 검색해 보세요.', brand: '브랜드', demoNote: '샘플 제품으로, 아직 구매할 수 없습니다.', toCheckout: '보안 결제 페이지로 이동 중\u2026',
    empty: '장바구니가 비어 있습니다.', subtotal: '소계', gst: '싱가포르 GST 9% 포함', checkout: 'PayNow / 카드 결제',
    pr: [['37.56N', '서울', '직접 방문해 고릅니다. 스무 곳 중 한 곳 미만만 입점합니다.'], ['4,630 KM', '바다 위', '배치 기록과 콜드체인 데이터가 함께 이동합니다.'], ['1.35N', '싱가포르', '카테고리별 규정 준수를 마친 뒤 등록됩니다.']] },
};

// Landing page (volume hero, cover band, "Six ways in").
Object.assign(T.en, {
  edCover: 'Cover story', edContents: 'In this issue', edStories: (n) => (n === 1 ? '1 story' : `${n} stories`), edBy: 'By',
  edNext: 'Next story', edShare: 'Copy link', edCopied: 'Link copied',
  // Countdown band (home)
  cdKicker: 'Next volume', cdDays: (n) => (n === 1 ? 'day' : 'days'), cdUntil: (vol, season, date) => `until Volume ${vol}${season ? ' · ' + season : ''} opens on ${date}`,
  cdFrom: (vol, date) => `Volume ${vol} opened ${date}`, cdTo: (vol, date) => `Volume ${vol} arrives ${date}`,
  cdToday: (d, n) => `Today · day ${d} of ${n}`, cdSee: 'See what’s in this volume',
  // How the drops work (volume page)
  dwLead: 'Four times a year we publish a volume: a small, seasonal edit of the best things we found in Korea. Here is how it works.',
  dwCal: 'The year in volumes', dwOpen: 'Open now', dwNext: 'Next', dwLater: 'Coming', dwTodayMark: 'Today',
  dwLife: 'The life of a piece',
  dwSteps: [
    ['Found', 'We visit makers across Korea in person and test what they make. Fewer than one in twenty are taken on.'],
    ['Opens', 'On the first day of the season the volume goes live: one piece from each category, in small batches.'],
    ['Sells through', 'Each batch is only as big as its maker can make well. When it sells out, it is gone until they make more.'],
    ['Moves to the shop', 'When the next volume opens, earlier pieces stay in the shop while stock lasts, and the volume moves to Past drops.'],
  ],
  dwFaqH: 'Good to know',
  dwFaq: (dates) => [
    ['When does a new volume open?', `On the first day of each season: ${dates}.`],
    ['Do I have to wait for a drop to buy?', 'No. Everything we carry is in the shop all year. A volume is our seasonal edit, not the only way in.'],
    ['What if a piece sells out?', 'Batches are small on purpose. When one is gone, it is gone until the maker makes another.'],
    ['What happens when a volume closes?', 'Its pieces move into the shop while stock lasts, and the volume itself is kept in Past drops.'],
  ],
  // About page
  abKicker: 'About Haemun', abH: 'A sea gate.\nA gate to SEA.',
  abLede: 'Haemun brings a small number of Korean makers, ateliers and clinics to Singapore and Southeast Asia, and handles everything between their door and yours.',
  abNameH: 'The name', abNameIntro: 'Haemun (해문) is a Korean word. Like many Korean words, it can also be written in Hanja, the Chinese characters used in Korean: 海門.',
  abParts: [
    ['해', '海', 'hae', 'sea', 'The water between Korea and Southeast Asia, crossed by every shipment we send.'],
    ['문', '門', 'mun', 'gate', 'The way in: for Korean makers reaching the region, and for customers reaching Korea.'],
  ],
  abSea: 'And one more reading. Say hae in English and you hear SEA: Southeast Asia, the region we serve.',
  abSum: '해문 · 海門 · Haemun: a sea gate, and Korea’s gate to SEA.',
  abWhyH: 'Why we exist', abHowH: 'How we work', abCarryH: 'What we carry',
  abJoinH: 'Work with us', abMakerH: 'Korean makers', abMakerB: 'Too small for an export house? That is who we look for. We handle import, compliance, logistics and selling, online and with retail partners.',
  abShopH: 'Retailers and clinics', abShopB: 'Trade accounts see wholesale tiers, minimum orders and compliance dossiers across every category.',
  abBrandsCta: 'See the brands we carry', abTradeCta: 'Switch to trade view', abWrite: 'Write to us at [EMAIL]',
  // Brands page
  brands: 'Brands', brKicker: 'The makers', brH: 'The brands we carry',
  brLede: 'Haemun is a gate for Korean makers too good to stay in Korea and too small for an export house. We introduce them here first, then work to put them on shelves across Singapore and Southeast Asia.',
  brPieces: (n) => (n === 1 ? '1 piece' : `${n} pieces`), brPiecesBy: (name) => `Pieces by ${name}`, brShop: (name) => `Shop ${name}`, brNoDesc: 'Profile coming soon.',
  brMore: 'More makers join with every volume.',
  brStockH: 'Want one of these brands in your store?', brStockB: 'Retailers, clinics and distributors can see wholesale tiers, minimum orders and compliance dossiers in trade view, or ask us about exclusive regional distribution.',
  brMakerH: 'Are you a Korean maker?', brMakerB: 'We are always looking. Tell us what you make and where you make it.',
  whyName: 'Haemun (해문, 海門) is Korean for sea gate. Read in English, hae is also SEA: Southeast Asia.',

  sNew: 'Recent arrivals', sLow: 'Price: low to high', sHigh: 'Price: high to low', sName: 'Name: A\u2013Z',
  featuredH: 'Featured', featuredSub: 'One from each category, picked by us',
  filter: 'Filter', results: (n) => (n === 1 ? '1 result' : `${n} results`), searchShop: 'Search the shop',
  fCat: 'Category', fPrice: 'Price', fColl: 'Collection', fAvail: 'Availability', fBrand: 'Brand',
  inStockOnly: 'In stock only', collFeat: 'Featured', clearAll: 'Clear all', showResults: (n) => (n === 1 ? 'Show 1 result' : `Show ${n} results`),
  under: (x) => `Under ${x}`, over: (x) => `${x} and over`, noneQ: (q) => `Nothing matches \u201c${q}\u201d.`,
  xingKicker: 'The crossing', xingH: 'Every piece makes the same crossing.',
  xingB: 'From a maker in Korea to your door in Singapore: 4,630 km by sea, with every batch documented and cleared before it is listed.',
  xingNext: (vol, date, days) => `Where we are this season: Volume ${vol} opens ${date}, ${days} days to go`,
  seaNames: ['YELLOW SEA', 'EAST CHINA SEA', 'SOUTH CHINA SEA'],
  jMore: (n) => `All ${n} stories in Editorial`,
  whyH: 'Shopping with Haemun', whySub: 'What to know before your first order',
  why: (free) => [
    [`Free delivery over ${free}`, 'Shipped from Korea, delivered across Singapore and Southeast Asia.'],
    ['PayNow or card', 'Secure checkout through our store. Prices include 9% Singapore GST.'],
    ['Small batches', 'Every piece is made in the quantity its maker can make well. When a batch sells out, it is gone until they make more.'],
    ['For trade', 'Retailers, clinics and stockists see wholesale tiers, minimum orders and compliance dossiers.', 'enableTrade', 'Switch to trade view'],
  ],
  volIntro: VOLUME.intro.en, howDrops: 'How drops work', dropsH: 'How the drops work', dropsSub: 'A new volume every season',
  pastDrops: 'Past drops', pastIntro: 'Every volume stays on record here after it closes.',
  pastNote: 'Volume 01 is our first. When Volume 02 opens, Volume 01 moves here, and its pieces stay in the shop while stock lasts.',
  openNow: 'Open now', viewVolume: 'View volume', comingOn: (date) => `Opens ${date}`, volumeN: (vol) => `Volume ${vol}`,
  themeCap: 'The theme', themeWhy: 'Why these six', volTitle: 'Six ways in', volSub: 'One piece from each category, chosen in person. Pick the one that sounds like you.',
  heroKicker: (vol, season) => `Volume ${vol} · ${season}`, now: 'Now',
  heroH: 'Start\nwith six.',
  heroDek: 'New to Korean makers? We went to Korea and chose one piece from each thing it does best. This is where to begin.',
  heroAlt: 'The six pieces of this volume on a walnut table, lit by low sun through a hanok door',
  curiousQ: 'Choose a category', volCta: (vol) => `Explore Volume ${vol}`,
  curious: { beauty: 'Skin', fashion: 'Style', wellness: 'Wellness', pet: 'My pet', medical: 'A trip to Seoul' },
  seeSix: (n) => (n === 6 ? 'See all six' : `See all ${n}`), shopEverything: (n) => `Shop everything · ${n}`,
  watchFilm: 'Watch the film',
  bandJournal: 'Journal · Latest', bandNext: (vol) => `Days to Volume ${vol}`,
  bandNextH: (season, date) => `${season} opens ${date}. How drops work \u2192`,
  bandTrade: 'Trade · B2B', bandTradeH: 'Stocking Haemun? See wholesale pricing \u2192',
  crossing: 'The crossing', crossNote: 'Every volume crosses by sea', seoul: 'Seoul', atSea: 'At sea', singapore: 'Singapore',
  startCat: {
    beauty: "Start here if you're new to Korean skincare.",
    fashion: "Start here if you want one piece you'll carry every day.",
    wellness: "Start here if you've heard of ginseng but never tried it.",
    pet: "Start here if your dog's paws take a beating.",
    medical: "Start here if you've thought about treatment in Seoul.",
  },
});
Object.assign(T.ko, {
  edCover: '커버 스토리', edContents: '이번 호의 이야기', edStories: (n) => `이야기 ${n}편`, edBy: '글',
  edNext: '다음 이야기', edShare: '링크 복사', edCopied: '링크가 복사되었습니다',
  cdKicker: '다음 호', cdDays: () => '일', cdUntil: (vol, season, date) => `제${Number(vol)}호${season ? ' · ' + season : ''} 공개까지 (${date})`,
  cdFrom: (vol, date) => `제${Number(vol)}호 ${date} 공개`, cdTo: (vol, date) => `제${Number(vol)}호 ${date} 도착`,
  cdToday: (d, n) => `오늘 · ${n}일 중 ${d}일째`, cdSee: '이번 호 보기',
  dwLead: '해문은 일 년에 네 번, 한국에서 찾은 가장 좋은 것을 모은 작은 시즌 에디트인 “호”를 발행합니다. 방식은 이렇습니다.',
  dwCal: '일 년의 호', dwOpen: '지금 공개', dwNext: '다음', dwLater: '예정', dwTodayMark: '오늘',
  dwLife: '제품의 여정',
  dwSteps: [
    ['발견', '한국 전역의 메이커를 직접 찾아가 제품을 테스트합니다. 스무 곳 중 한 곳 미만만 입점합니다.'],
    ['공개', '시즌 첫날 새 호가 공개됩니다. 카테고리마다 하나씩, 모두 소량 생산입니다.'],
    ['완판', '배치는 메이커가 잘 만들 수 있는 만큼만입니다. 품절되면 다시 만들 때까지 구할 수 없습니다.'],
    ['숍으로', '다음 호가 공개되면 이전 제품은 재고가 있는 동안 숍에 남고, 호는 지난 드롭으로 옮겨집니다.'],
  ],
  dwFaqH: '알아 두세요',
  dwFaq: (dates) => [
    ['새 호는 언제 공개되나요?', `매 시즌 첫날, ${dates}에 공개됩니다.`],
    ['드롭을 기다려야만 살 수 있나요?', '아니요. 모든 제품은 일 년 내내 숍에 있습니다. 호는 시즌 에디트일 뿐입니다.'],
    ['제품이 품절되면요?', '배치는 일부러 작게 만듭니다. 품절되면 메이커가 다시 만들 때까지 구할 수 없습니다.'],
    ['호가 마감되면 어떻게 되나요?', '제품은 재고가 있는 동안 숍으로 옮겨지고, 호는 지난 드롭에 기록으로 남습니다.'],
  ],
  abKicker: '해문 소개', abH: '바다의 문.\nSEA로 가는 문.',
  abLede: '해문은 소수의 한국 메이커, 아틀리에, 클리닉을 싱가포르와 동남아시아로 전하고, 그 사이의 모든 일을 맡습니다.',
  abNameH: '이름', abNameIntro: '해문은 한국어입니다. 많은 한국어 단어처럼 한자로도 쓸 수 있습니다: 海門.',
  abParts: [
    ['해', '海', 'hae', '바다', '한국과 동남아시아 사이의 바다. 저희가 보내는 모든 화물이 건너는 물길입니다.'],
    ['문', '門', 'mun', '문', '들어가는 길. 동남아시아로 향하는 한국 메이커에게도, 한국을 만나는 고객에게도.'],
  ],
  abSea: '그리고 하나 더. “해”를 영어로 읽으면 SEA, 저희가 일하는 동남아시아가 됩니다.',
  abSum: '해문 · 海門 · Haemun: 바다의 문, 그리고 SEA로 가는 한국의 문.',
  abWhyH: '해문이 하는 일', abHowH: '일하는 방식', abCarryH: '취급 카테고리',
  abJoinH: '함께하기', abMakerH: '한국 메이커', abMakerB: '수출 회사와 일하기엔 규모가 작으신가요? 저희가 찾는 분들입니다. 수입, 규정 준수, 물류, 판매를 온라인과 리테일 파트너를 통해 맡습니다.',
  abShopH: '리테일러와 클리닉', abShopB: '트레이드 계정에서 모든 카테고리의 도매가, 최소 주문 수량, 규정 준수 자료를 볼 수 있습니다.',
  abBrandsCta: '취급 브랜드 보기', abTradeCta: '트레이드 보기로 전환', abWrite: '[EMAIL]로 연락 주세요',
  brands: '브랜드', brKicker: '메이커', brH: '해문이 소개하는 브랜드',
  brLede: '해문은 한국에만 머물기엔 너무 좋고, 수출 회사와 일하기엔 규모가 작은 메이커를 위한 문입니다. 먼저 이곳에서 소개하고, 싱가포르와 동남아시아의 매장 진열대에 오르도록 돕습니다.',
  brPieces: (n) => `${n}개 제품`, brPiecesBy: (name) => `${name}의 제품`, brShop: (name) => `${name} 쇼핑하기`, brNoDesc: '소개가 곧 업데이트됩니다.',
  brMore: '호가 나올 때마다 새로운 메이커가 합류합니다.',
  brStockH: '이 브랜드를 매장에 들이고 싶으신가요?', brStockB: '리테일러, 클리닉, 유통사는 트레이드 보기에서 도매가, 최소 주문 수량, 규정 준수 자료를 확인하거나 지역 독점 유통을 문의할 수 있습니다.',
  brMakerH: '한국 메이커이신가요?', brMakerB: '언제나 찾고 있습니다. 무엇을 어디서 만드는지 알려 주세요.',
  whyName: '해문(海門)은 바다의 문이라는 뜻의 한국어입니다. 영어로 읽으면 “해”는 SEA, 곧 동남아시아이기도 합니다.',

  sNew: '최신순', sLow: '낮은 가격순', sHigh: '높은 가격순', sName: '이름순',
  featuredH: '추천', featuredSub: '카테고리마다 하나씩 고른 추천 제품',
  filter: '필터', results: (n) => `${n}개 제품`, searchShop: '숍에서 검색',
  fCat: '카테고리', fPrice: '가격', fColl: '컬렉션', fAvail: '재고', fBrand: '브랜드',
  inStockOnly: '재고 있는 제품만', collFeat: '추천', clearAll: '모두 지우기', showResults: (n) => `${n}개 제품 보기`,
  under: (x) => `${x} 미만`, over: (x) => `${x} 이상`, noneQ: (q) => `\u201c${q}\u201d에 맞는 제품이 없습니다.`,
  xingKicker: '바다를 건너', xingH: '모든 제품은 같은 바다를 건넙니다.',
  xingB: '한국의 메이커에서 싱가포르의 문 앞까지, 바닷길 4,630km. 모든 배치는 기록되고 통관을 마친 뒤에야 등록됩니다.',
  xingNext: (vol, date, days) => `이번 시즌의 위치: 제${Number(vol)}호 ${date} 공개, ${days}일 남음`,
  seaNames: ['황해', '동중국해', '남중국해'],
  jMore: (n) => `에디토리얼 이야기 ${n}편 모두 보기`,
  whyH: '해문에서 쇼핑하기', whySub: '첫 주문 전에 알아 두세요',
  why: (free) => [
    [`${free} 이상 무료 배송`, '한국에서 직송해 싱가포르와 동남아시아 전역으로 배송합니다.'],
    ['PayNow 또는 카드 결제', '저희 스토어의 보안 결제를 이용합니다. 가격에는 싱가포르 GST 9%가 포함되어 있습니다.'],
    ['소량 생산', '모든 제품은 메이커가 잘 만들 수 있는 만큼만 만듭니다. 배치가 품절되면 다시 만들 때까지 구할 수 없습니다.'],
    ['입점 문의', '리테일러, 클리닉, 스토키스트는 도매가, 최소 주문 수량, 규정 준수 자료를 볼 수 있습니다.', 'enableTrade', '트레이드 보기로 전환'],
  ],
  volIntro: VOLUME.intro.ko, howDrops: '드롭 방식', dropsH: '드롭 방식', dropsSub: '매 시즌 새로운 호',
  pastDrops: '지난 드롭', pastIntro: '마감된 호는 모두 이곳에 기록으로 남습니다.',
  pastNote: '제1호는 저희의 첫 호입니다. 제2호가 공개되면 제1호는 이곳으로 옮겨지고, 제품은 재고가 남아 있는 동안 숍에서 계속 판매됩니다.',
  openNow: '지금 공개', viewVolume: '호 보기', comingOn: (date) => `${date} 공개`, volumeN: (vol) => `제${Number(vol)}호`,
  themeCap: '테마', themeWhy: '이 여섯 가지를 고른 이유', volTitle: '여섯 가지 입문', volSub: '카테고리마다 하나씩, 직접 고른 제품입니다. 마음에 드는 것부터 시작하세요.',
  heroKicker: (vol, season) => `제${Number(vol)}호 · ${season}`, now: '공개 중',
  heroH: '여섯 가지로\n시작하기.',
  heroDek: '한국 메이커가 처음이신가요? 저희가 직접 한국을 찾아, 한국이 가장 잘하는 분야마다 하나씩 골랐습니다. 여기서 시작하세요.',
  heroAlt: '한옥 문살 사이로 드는 햇빛 아래 호두나무 테이블 위의 이번 호 여섯 가지 제품',
  curiousQ: '카테고리를 고르세요', volCta: (vol) => `제${Number(vol)}호 둘러보기`,
  curious: { beauty: '스킨케어', fashion: '스타일', wellness: '웰니스', pet: '반려동물', medical: '서울 의료 여행' },
  seeSix: (n) => `${n}가지 모두 보기`, shopEverything: (n) => `전체 상품 · ${n}`,
  watchFilm: '영상 보기',
  bandJournal: '저널 · 최신', bandNext: (vol) => `제${Number(vol)}호까지 남은 날`,
  bandNextH: (season, date) => `${season} 호는 ${date} 공개. 드롭 방식 보기 \u2192`,
  bandTrade: '트레이드 · B2B', bandTradeH: '해문 입점을 원하시나요? 도매가 보기 \u2192',
  crossing: '바다를 건너', crossNote: '모든 호는 바다를 건너 옵니다', seoul: '서울', atSea: '바다 위', singapore: '싱가포르',
  startCat: {
    beauty: '한국 스킨케어가 처음이라면 여기서 시작하세요.',
    fashion: '매일 들 하나를 찾는다면 여기서 시작하세요.',
    wellness: '홍삼을 들어만 보셨다면 여기서 시작하세요.',
    pet: '반려견 발바닥이 거칠어졌다면 여기서 시작하세요.',
    medical: '서울에서의 시술을 고민해 보셨다면 여기서 시작하세요.',
  },
});

