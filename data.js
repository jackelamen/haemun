const CATS = ['beauty', 'fashion', 'wellness', 'pet', 'medical'];
const CAT_COLOR = { beauty: '#C1272D', fashion: '#0B0B0C', wellness: '#1F3F8C', pet: '#A8742A', medical: '#2E6B5E' };

// The site runs WooCommerce, so real product data lives in WooCommerce's
// own tables, not a plain WordPress post. The Store API is WooCommerce's
// public, no-auth-required endpoint meant for exactly this (a separate
// storefront) — no API keys, no ACF setup needed.
const WC_STORE_API = 'https://mediumblue-crow-786275.hostingersite.com/wp-json/wc/store/v1';

const stripTags = (html) => String(html || '').replace(/<[^>]*>/g, '').trim();

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
    name: stripTags(p.name),
    ko: '',
    origin: 'Seoul',
    moq: 1,
    service: false,
    teaser: stripTags(p.short_description) || stripTags(p.description).slice(0, 160),
    form: [['Description', stripTags(p.description) || stripTags(p.short_description)]],
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
    const res = await fetch(`${WC_STORE_API}/products?per_page=100`);
    if (!res.ok) throw new Error('WooCommerce Store API request failed: ' + res.status);
    const items = await res.json();
    if (!Array.isArray(items) || !items.length) return; // keep mock fallback
    const mapped = items.map(mapWcProduct);
    PRODUCTS.length = 0;
    PRODUCTS.push(...mapped);
  } catch (err) {
    console.warn('Falling back to mock products —', err.message);
  }
}

let PRODUCTS = [
  { id: 'p1', vol: true, cat: 'beauty', shape: 'jar', bg: '#DEDEDA', fill: '#0B0B0C', price: 54, name: 'Chungdam Cellular Barrier Cream', ko: '청담 셀룰러 배리어 크림', origin: 'Seoul, Gangnam', moq: 48,
    teaser: 'Ceramide and peptide balm, developed with Cheongdam dermatology clinics.',
    form: [['Key actives', 'Ceramide NP 3%, 5-peptide complex, panthenol'], ['Texture', 'Dense balm-cream, 50 ml'], ['Free of', 'Synthetic fragrance, mineral oil, parabens']],
    prov: [['Atelier', 'Independent laboratory, Cheongdam-dong'], ['Batch', 'Small batch, 1,200 units per run'], ['Story', 'Developed for post-laser recovery, now for everyday use.']] },
  { id: 'p3', vol: true, cat: 'beauty', shape: 'dropper', bg: '#D9DCD8', fill: '#5A3B22', price: 42, name: 'Jeju Artemisia Calming Ampoule', ko: '제주 쑥 진정 앰플', origin: 'Jeju Island', moq: 60,
    teaser: 'Mugwort grown on basalt soil, cold-pressed on the island.',
    form: [['Key actives', 'Jeju artemisia 78%, madecassoside, allantoin'], ['Texture', 'Watery serum, 30 ml amber glass'], ['Free of', 'Alcohol, essential oils']],
    prov: [['Atelier', 'Farm cooperative, Jeju'], ['Batch', 'Spring harvest, pressed within 24 hours']] },
  { id: 'p5', cat: 'beauty', shape: 'box', bg: '#D2D5D2', fill: '#2F4A3A', price: 38, name: 'Pine Needle Bio-Peptide Cleanser', ko: '솔잎 바이오 펩타이드 클렌저', origin: 'Gangwon', moq: 72,
    teaser: 'Red pine from the Pyeongchang highlands, in a low-pH gel.',
    form: [['Key actives', 'Red pine needle extract, copper tripeptide-1'], ['Texture', 'Low-pH gel to foam, 150 ml']],
    prov: [['Atelier', 'Forest laboratory, Pyeongchang']] },
  { id: 'b4', cat: 'beauty', shape: 'bottle', bg: '#E2E1DD', fill: '#8C6A3A', price: 58, name: 'Jeju Camellia Body Oil', ko: '제주 동백 바디 오일', origin: 'Jeju Island', moq: 48,
    teaser: 'Cold-pressed camellia seed oil for body and hair.',
    form: [['Key actives', 'Camellia japonica seed oil, vitamin E'], ['Format', '100 ml glass bottle']],
    prov: [['Atelier', 'Camellia grove press, Seogwipo']] },
  { id: 'f1', vol: true, cat: 'fashion', shape: 'tee', bg: '#E4E3DF', fill: '#2B2B2D', price: 320, name: 'Hanji-Fibre Knit Cardigan', ko: '한지 원사 니트 가디건', origin: 'Seoul, Seongsu', moq: 12,
    teaser: 'Knitted from mulberry-paper yarn. Light, cool and structured.',
    form: [['Material', 'Hanji paper yarn 70%, cotton 30%'], ['Fit', 'Relaxed, dropped shoulder'], ['Care', 'Cold hand wash, dry flat']],
    prov: [['Atelier', 'Knit studio, Seongsu-dong'], ['Yarn', 'Mulberry paper spun in Jeonju']] },
  { id: 'f2', cat: 'fashion', shape: 'tee', bg: '#DCDAD3', fill: '#CFC6B3', price: 240, name: 'Andong Ramie Summer Shirt', ko: '안동포 여름 셔츠', origin: 'Andong', moq: 12,
    teaser: 'Hand-woven Andong ramie, the cloth of Korean summers.',
    form: [['Material', 'Andong ramie 100%'], ['Fit', 'Straight, band collar'], ['Care', 'Hand wash, press damp']],
    prov: [['Atelier', 'Ramie weavers, Andong']] },
  { id: 'f3', cat: 'fashion', shape: 'bag', bg: '#D6D6D2', fill: '#1B1B1D', price: 680, name: 'Najeon Lacquer Leather Tote', ko: '나전 옻칠 레더 토트', origin: 'Tongyeong', moq: 6,
    teaser: 'Vegetable-tanned leather with a mother-of-pearl lacquer clasp.',
    form: [['Material', 'Vegetable-tanned calfskin, najeon clasp'], ['Size', '38 × 30 × 12 cm'], ['Care', 'Condition every six months']],
    prov: [['Atelier', 'Najeon lacquer workshop, Tongyeong']] },
  { id: 'p2', vol: true, cat: 'wellness', shape: 'bottle', bg: '#D4D4D0', fill: '#7A2A22', price: 88, name: 'Red Ginseng Nano-Ferment Elixir', ko: '홍삼 나노 발효 엘릭서', origin: 'Geumsan', moq: 36,
    teaser: 'Six-year red ginseng, steamed nine times and slowly fermented.',
    form: [['Key actives', 'Six-year Korean red ginseng, Compound K'], ['Format', '30 × 10 ml vials'], ['Ritual', 'One vial each morning']],
    prov: [['Atelier', 'Family ginseng house, Geumsan-gun'], ['Batch', 'Nine steamings, clay fermentation']] },
  { id: 'p4', cat: 'wellness', shape: 'bottle', bg: '#E2E2DF', fill: '#0B0B0C', price: 62, name: 'Black Sesame & Biotin Tonic', ko: '흑임자 비오틴 토닉', origin: 'Seoul, Mapo', moq: 48,
    teaser: 'A family heukimja recipe, rebuilt for hair and scalp.',
    form: [['Key actives', 'Stone-roasted black sesame, biotin, zinc'], ['Format', '500 ml, 14 servings']],
    prov: [['Atelier', 'Hanbang tonic studio, Mapo-gu']] },
  { id: 'p6', cat: 'wellness', shape: 'box', bg: '#E4E3E0', fill: '#C1272D', price: 50, name: 'Inner-Radiance Glutathione Film', ko: '이너 래디언스 글루타치온 필름', origin: 'Seoul, Seongsu', moq: 60,
    teaser: 'Glutathione that dissolves on the tongue. Thirty films.',
    form: [['Key actives', 'Reduced L-glutathione 250 mg, vitamin C'], ['Format', '30 orally dissolving films']],
    prov: [['Atelier', 'Nutraceutical studio, Seongsu-dong']] },
  { id: 't1', cat: 'pet', shape: 'pouch', bg: '#DEDCD6', fill: '#6B4B2E', price: 34, name: 'Hanwoo Bone Broth for Dogs', ko: '한우 사골 강아지 보양식', origin: 'Hoengseong', moq: 48,
    teaser: 'Slow-simmered Hanwoo bone broth. No salt, no onion.',
    form: [['Ingredients', 'Hanwoo beef bone, pumpkin, jujube'], ['Format', '6 × 120 ml pouches'], ['Serve', 'Warm, over dry food']],
    prov: [['Atelier', 'Hanwoo farm kitchen, Hoengseong']] },
  { id: 't2', vol: true, cat: 'pet', shape: 'bowl', bg: '#D8DBD8', fill: '#8FA89A', price: 96, name: 'Icheon Celadon Pet Bowl', ko: '이천 청자 반려동물 식기', origin: 'Icheon', moq: 12,
    teaser: 'Wheel-thrown celadon, raised for easier eating.',
    form: [['Material', 'Celadon stoneware, lead-free glaze'], ['Size', '16 cm, 450 ml'], ['Care', 'Dishwasher safe']],
    prov: [['Atelier', 'Kiln workshop, Icheon ceramics village']] },
  { id: 't3', cat: 'pet', shape: 'jar', bg: '#E3E2DE', fill: '#0B0B0C', price: 28, name: 'Jeju Horse Oil Paw Balm', ko: '제주 마유 발바닥 밤', origin: 'Jeju Island', moq: 72,
    teaser: 'Horse oil and beeswax for cracked paws and noses.',
    form: [['Ingredients', 'Jeju horse oil, beeswax, calendula'], ['Format', '30 g tin']],
    prov: [['Atelier', 'Island apothecary, Jeju']] },
  { id: 'm1', vol: true, cat: 'medical', service: true, shape: 'card', bg: '#D5DAD8', fill: '#2E6B5E', price: 1850, name: 'Gangnam Dermatology Passage', ko: '강남 피부과 패시지', origin: 'Seoul, Gangnam', moq: 1,
    teaser: 'Three days: consultation, treatment plan and aftercare, arranged end to end.',
    form: [['Includes', 'Consultation, two treatment sessions, aftercare kit'], ['Duration', '3 days, 2 nights'], ['Arranged', 'Clinic booking, interpreter, hotel transfer']],
    prov: [['Provider', '[PARTNER CLINIC], Gangnam-gu'], ['Coordinator', 'Haemun Seoul office']] },
  { id: 'm2', cat: 'medical', service: true, shape: 'card', bg: '#DADCDB', fill: '#0B0B0C', price: 1400, name: 'Executive Health Screening', ko: '프리미엄 종합 건강검진', origin: 'Seoul, Jongno', moq: 1,
    teaser: 'A full-day screening with an English-speaking results review.',
    form: [['Includes', 'Full-body screening, imaging, results review'], ['Duration', '1 day, results in 7 days'], ['Arranged', 'Booking, interpreter, translated report']],
    prov: [['Provider', '[PARTNER HOSPITAL], Seoul'], ['Coordinator', 'Haemun Seoul office']] },
  { id: 'm3', cat: 'medical', service: true, shape: 'card', bg: '#D3D7D4', fill: '#7A2A22', price: 2600, name: 'Hanbang Recovery Retreat', ko: '한방 회복 리트릿', origin: 'Jeju Island', moq: 1,
    teaser: 'Five days of Korean medicine, rest and island air.',
    form: [['Includes', 'Hanbang consultation, daily treatments, meals'], ['Duration', '5 days, 4 nights'], ['Arranged', 'Retreat booking, transfers']],
    prov: [['Provider', '[PARTNER RETREAT], Jeju'], ['Coordinator', 'Haemun Seoul office']] },
];
const POSTS = [
  { id: 'j1', cat: 'beauty', product: 'p1', date: '18 SEP 2026', read: '6 MIN', author: 'Haemun Editors',
    title: { en: 'Inside a Cheongdam laboratory', ko: '청담동 연구실 안에서' },
    dek: { en: 'How a clinic-born barrier cream is made, one 1,200-unit batch at a time.', ko: '클리닉에서 태어난 배리어 크림이 1,200개 단위로 만들어지는 과정.' },
    paras: ['The laboratory sits above a dermatology clinic on a quiet Cheongdam side street. Its formulas began as aftercare for laser patients and moved, slowly, into daily use.', 'Every batch is small by design. The team would rather sell out than compromise the ceramide ratio that makes the cream work.', 'We visited in August, tested three batches, and chose the one you see in Volume 01.'] },
  { id: 'j2', cat: 'fashion', product: 'f2', date: '11 SEP 2026', read: '8 MIN', author: 'Haemun Editors',
    title: { en: 'Andong ramie, the summer cloth', ko: '안동포, 여름의 옷감' },
    dek: { en: "A fibre woven by hand for centuries, and why it suits Singapore's climate.", ko: '수백 년 동안 손으로 짜 온 섬유, 그리고 싱가포르 기후에 맞는 이유.' },
    paras: ['Ramie has been woven in Andong for generations. The fibre is split by hand, joined by mouth and woven on narrow looms.', 'The finished cloth is crisp, breathable and dries quickly: qualities that matter far more in Singapore than in Seoul.', 'Our shirt uses cloth from a single weaving family, cut in Seoul.'] },
  { id: 'j3', cat: 'wellness', product: 'p2', date: '02 SEP 2026', read: '5 MIN', author: 'Haemun Editors',
    title: { en: 'Nine steamings in Geumsan', ko: '금산의 구증구포' },
    dek: { en: 'The slow process that turns white ginseng red.', ko: '백삼을 홍삼으로 바꾸는 느린 과정.' },
    paras: ['Six-year roots are steamed and dried nine times. Each cycle deepens the colour and changes the compounds inside.', 'The family we work with ferments the result in clay, a step most producers skip.', 'It is slow, and it is the reason the elixir tastes the way it does.'] },
  { id: 'j4', cat: 'pet', product: 't2', date: '26 AUG 2026', read: '4 MIN', author: 'Haemun Editors',
    title: { en: 'Pet care, the Seoul way', ko: '서울식 반려동물 케어' },
    dek: { en: 'Bone broth, celadon bowls and the city that takes its dogs seriously.', ko: '사골, 청자 식기, 그리고 반려견을 진지하게 대하는 도시.' },
    paras: ['Seoul has some of the most considered pet products in Asia, from Hanwoo broths to hand-thrown bowls.', 'We chose three to start: food, a bowl and a balm, each made by people who make things for humans too.', 'More will follow in Volume 02.'] },
  { id: 'j5', cat: 'medical', product: 'm1', date: '19 AUG 2026', read: '9 MIN', author: 'Haemun Editors',
    title: { en: "A first-timer's guide to medical travel in Seoul", ko: '서울 의료 여행 첫걸음' },
    dek: { en: 'What to expect, what to ask and how we arrange it.', ko: '무엇을 기대하고, 무엇을 묻고, 해문이 어떻게 준비하는지.' },
    paras: ["Seoul is one of the world's leading destinations for dermatology and health screening. The difficulty is knowing where to go.", 'We work with a small number of providers, arrange bookings and interpreters, and stay in contact from arrival to aftercare.', 'Every package begins with a consultation request. Nothing is booked until you have spoken to the provider.'] },
  { id: 'j6', cat: 'house', product: null, shape: 'card', bg: '#0B0B0C', fill: '#C1272D', date: '12 AUG 2026', read: '3 MIN', author: 'Haemun',
    title: { en: 'Volume 01: notes on the first six', ko: '제1호: 첫 여섯 가지에 대한 노트' },
    dek: { en: 'Why we publish in volumes, and what we chose for the first.', ko: '왜 호 단위로 발행하는지, 그리고 첫 호의 선택.' },
    paras: ['We publish in volumes because we would rather choose carefully than stock everything.', 'Volume 01 has one object from each of our categories, plus one more beauty piece we could not leave out.', 'The full shop holds everything we carry. The volume holds what we would give a friend.'] },
];
const T = {
  en: { ann1: 'Shipped from Korea to Singapore', ann2: 'Compliance handled for every category',
    volume: 'Volume 01', shop: 'Shop', shopAll: 'Shop all', journal: 'Journal', about: 'About', trade: 'Trade', bag: 'Bag',
    cats: { beauty: 'Beauty & Body Care', fashion: 'Fashion', wellness: 'Health & Wellness', pet: 'Premium Pet Care', medical: 'Medical Travel', house: 'The House' },
    catsKo: { beauty: '뷰티 & 바디케어', fashion: '패션', wellness: '헬스 & 웰니스', pet: '프리미엄 펫케어', medical: '메디컬 트래블' },
    catDesc: { beauty: 'Skin, body and hair formulas from independent Korean laboratories.', fashion: 'Clothing and objects made with Korean materials: hanji, ramie, najeon.', wellness: 'Ginseng, hanbang and functional nutrition, HSA notified.', pet: 'Food, care and objects for animals, made to the same standard as ours.', medical: 'Dermatology, screening and recovery in Korea, arranged end to end.' },
    cap1: 'Dalhangari, the moon jar. Empty by design.', volTag: '해문 제1호', h1: 'Korea,\nby sea.',
    sub: 'Every season, Haemun selects Korean makers, ateliers and clinics, and brings their work to Singapore and Southeast Asia.',
    seeVol: 'See the volume', enterMall: 'Enter the shop',
    volTitle: 'Volume 01: six objects', volSub: 'Autumn 2026 · One from every category',
    catH: 'Shop by category', catSub: 'Five categories, one standard.',
    jH: 'From the journal', jSub: 'Makers, materials and places.', jAll: 'All stories',
    houseEyebrow: 'The house', houseSub: 'Singapore and Seoul', aboutMore: 'About Haemun',
    houseH: 'We work with makers too small for export houses, and too good to stay in Korea.',
    houseB: 'We visit each one, test what they make, handle import and compliance ourselves, then carry it south.',
    statA: 'Categories', statB: 'Direct from Korea',
    tradeNote: 'TRADE VIEW · WHOLESALE PRICES EXCLUDE GST', add: 'Add to bag +', inquire: 'Request batch quote', enquire: 'Request consultation', dossier: 'REQUEST COMPLIANCE DOSSIER',
    rrp: 'incl. GST', wsp: 'Wholesale', from: 'From', perPerson: 'per person', tabF: 'Details', tabP: 'Provenance', tabS: 'Compliance', close: 'Close',
    sort: 'Sort', sNew: 'Featured', sLow: 'Price ↑', sHigh: 'Price ↓', category: 'Category', origin: 'Origin', clear: 'Clear filters', all: 'All', none: 'Nothing matches these filters.', objects: 'items',
    medNote: 'Medical Travel packages are arranged by Haemun and delivered by licensed providers in Korea. Each begins with a consultation request; nothing is booked or charged until you have spoken to the provider.', medTag: 'By consultation',
    jIntro: 'Makers, materials and places.', featuredLabel: 'Featured', readStory: 'Read the story', by: 'Words', inStory: 'In this story', view: 'View',
    aboutH: 'Haemun means\nsea gate.', aboutLede: 'A Singapore company with an office in Seoul. We bring a small number of Korean makers, ateliers and clinics to Southeast Asia.',
    aboutParas: ['海門, haemun, is the old word for a harbour mouth: the gate between land and open water. We chose it because that is the job. We stand between Korean makers and Southeast Asian customers, and make the crossing simple for both.', 'Korea makes some of the most considered products in the world, but many of the best makers are too small to export. They have no one to handle import permits, HSA notification, labelling or logistics.', 'We do that work. We visit every maker, test what they make, publish a small selection each season, and keep the full range in our shop.'],
    aCarry: 'What we carry', aCarrySub: 'Five categories under one standard.',
    aHow: 'How we work', aHowSub: 'From a maker in Korea to a shelf in Singapore.',
    how: [['01', 'Select', 'We visit every maker in person. Fewer than one in twenty are taken on.'], ['02', 'Verify', 'Batches are tested and documented before shipping. Services are reviewed in person.'], ['03', 'Comply', 'HSA, AVS and customs requirements are handled by us, category by category.'], ['04', 'Deliver', 'Shipped by sea to Singapore, then delivered across Southeast Asia.']],
    aCo: 'The company', aCoSub: 'Haemun Pte. Ltd.',
    facts: [['Headquarters', 'Singapore, [ADDRESS]'], ['Sourcing office', 'Seoul, [ADDRESS]'], ['Founded', '[YEAR]'], ['Registration', 'UEN [NUMBER]'], ['Contact', '[EMAIL]']],
    tradeH: 'For retailers, clinics and stockists.', tradeB: 'Trade accounts see wholesale tiers, minimum orders and compliance dossiers across every category.', tradeCta: 'Switch to trade view',
    footer: 'Korea to Singapore, by sea.', fHouse: 'House', fHelp: 'Help', fShip: 'Shipping', fReturns: 'Returns', fContact: 'Contact',
    empty: 'Your bag is empty.', subtotal: 'Subtotal', gst: 'Prices include 9% Singapore GST', checkout: 'Proceed to PayNow / Card',
    pr: [['37.56N', 'Seoul', 'Chosen in person. Fewer than one in twenty makers make it.'], ['4,630 KM', 'At sea', 'Batch records and cold-chain data travel with every shipment.'], ['1.35N', 'Singapore', 'Cleared and compliant for its category before anything is listed.']] },
  ko: { ann1: '한국에서 싱가포르로 직송', ann2: '모든 카테고리 규정 준수',
    volume: '제1호', shop: '숍', shopAll: '전체 상품', journal: '저널', about: '소개', trade: '입점사', bag: '장바구니',
    cats: { beauty: '뷰티 & 바디케어', fashion: '패션', wellness: '헬스 & 웰니스', pet: '프리미엄 펫케어', medical: '메디컬 트래블', house: '하우스' },
    catsKo: { beauty: 'Beauty & Body Care', fashion: 'Fashion', wellness: 'Health & Wellness', pet: 'Premium Pet Care', medical: 'Medical Travel' },
    catDesc: { beauty: '독립 연구실의 스킨, 바디, 헤어 포뮬러.', fashion: '한지, 모시, 나전 등 한국 소재로 만든 옷과 오브젝트.', wellness: '홍삼, 한방, 기능성 영양. HSA 신고 완료.', pet: '사람의 것과 같은 기준으로 만든 반려동물 제품.', medical: '한국의 피부과, 건강검진, 회복 프로그램을 처음부터 끝까지.' },
    cap1: '달항아리. 비워 둔 아름다움.', volTag: 'HAEMUN VOLUME 01', h1: '한국,\n바다 건너.',
    sub: '해문은 매 시즌 한국의 메이커, 아틀리에, 클리닉을 골라 싱가포르와 동남아시아로 전합니다.',
    seeVol: '이번 호 보기', enterMall: '숍 둘러보기',
    volTitle: '제1호: 여섯 가지 오브젝트', volSub: '2026 가을 · 카테고리마다 하나씩',
    catH: '카테고리별 쇼핑', catSub: '다섯 카테고리, 하나의 기준.',
    jH: '저널', jSub: '메이커, 소재, 장소.', jAll: '모든 이야기',
    houseEyebrow: '하우스', houseSub: '싱가포르와 서울', aboutMore: '해문 소개',
    houseH: '수출하기엔 너무 작고, 한국에만 두기엔 너무 좋은 메이커와 일합니다.',
    houseB: '직접 방문하고, 검사하고, 수입과 규정 준수를 직접 처리한 뒤 남쪽으로 옮깁니다.',
    statA: '카테고리', statB: '한국 직송',
    tradeNote: '입점사 보기 · 도매가 GST 별도', add: '장바구니 담기 +', inquire: '배치 견적 요청', enquire: '상담 요청', dossier: '규정 준수 자료 요청',
    rrp: 'GST 포함', wsp: '도매가', from: '부터', perPerson: '1인 기준', tabF: '상세', tabP: '원산지', tabS: '규정 준수', close: '닫기',
    sort: '정렬', sNew: '추천순', sLow: '낮은 가격', sHigh: '높은 가격', category: '카테고리', origin: '원산지', clear: '필터 초기화', all: '전체', none: '조건에 맞는 제품이 없습니다.', objects: '품목',
    medNote: '메디컬 트래블 패키지는 해문이 준비하고 한국의 면허 기관이 제공합니다. 모든 패키지는 상담 요청으로 시작하며, 상담 전에는 예약이나 결제가 이루어지지 않습니다.', medTag: '상담 후 예약',
    jIntro: '메이커, 소재, 장소.', featuredLabel: '추천', readStory: '이야기 읽기', by: '글', inStory: '이 이야기 속 제품', view: '보기',
    aboutH: '해문,\n바다의 문.', aboutLede: '서울에 사무소를 둔 싱가포르 회사. 소수의 한국 메이커, 아틀리에, 클리닉을 동남아시아에 소개합니다.',
    aboutParas: ['해문(海門)은 항구의 입구, 땅과 바다 사이의 문을 뜻합니다. 그것이 우리의 일이기에 이 이름을 골랐습니다.', '한국은 세계에서 가장 정성스러운 제품을 만들지만, 좋은 메이커 중 다수는 수출하기에 너무 작습니다.', '해문이 그 일을 합니다. 모든 메이커를 방문하고, 검사하고, 매 시즌 소수를 골라 발행하며, 전체 제품은 숍에 둡니다.'],
    aCarry: '취급 카테고리', aCarrySub: '하나의 기준, 다섯 카테고리.',
    aHow: '일하는 방식', aHowSub: '한국의 메이커에서 싱가포르의 매대까지.',
    how: [['01', '선택', '모든 메이커를 직접 방문합니다. 스무 곳 중 한 곳 미만만 입점합니다.'], ['02', '검증', '배치를 검사하고 기록합니다. 서비스는 직접 확인합니다.'], ['03', '준수', 'HSA, AVS, 통관 요건을 카테고리별로 처리합니다.'], ['04', '배송', '바다로 싱가포르까지, 그리고 동남아시아 전역으로.']],
    aCo: '회사', aCoSub: 'Haemun Pte. Ltd.',
    facts: [['본사', '싱가포르, [주소]'], ['소싱 사무소', '서울, [주소]'], ['설립', '[연도]'], ['등록번호', 'UEN [번호]'], ['문의', '[이메일]']],
    tradeH: '리테일러, 클리닉, 입점사를 위해.', tradeB: '입점사 계정은 모든 카테고리의 도매 단가, 최소 주문량, 규정 준수 자료를 볼 수 있습니다.', tradeCta: '입점사 보기로 전환',
    footer: '한국에서 싱가포르로, 바다 건너.', fHouse: '하우스', fHelp: '도움말', fShip: '배송', fReturns: '반품', fContact: '문의',
    empty: '장바구니가 비어 있습니다.', subtotal: '소계', gst: '싱가포르 GST 9% 포함', checkout: 'PayNow / 카드 결제',
    pr: [['37.56N', '서울', '직접 방문해 고릅니다. 스무 곳 중 한 곳 미만만 입점합니다.'], ['4,630 KM', '바다 위', '배치 기록과 콜드체인 데이터가 함께 이동합니다.'], ['1.35N', '싱가포르', '카테고리별 규정 준수를 마친 뒤 등록됩니다.']] },
};
