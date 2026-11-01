export const shoppingCopy = {
  ko: {
    shopping: '쇼핑 가이드', shoppingTitle: '대전 쇼핑 가이드', shoppingEyebrow: '중앙로 · 은행동에서 만나는 일상',
    shoppingIntro: '대전의 빵부터 한국 뷰티와 여행 필수품까지. 자유시간에 가까운 상점을 찾아보세요.',
    all: '전체', bakery: '베이커리 · 지역 먹거리', beauty: 'K-뷰티 · 화장품', essentials: '생활 · 여행용품',
    filters: '쇼핑 카테고리', openMap: '네이버 지도에서 보기', allMaps: '전체 쇼핑 장소 지도 보기',
    mapsIntro: '갈 곳을 선택하면 네이버 지도가 새 탭에서 열립니다.', address: '주소', sources: '매장 정보 · 사진 출처',
    checked: '매장 정보 확인', mapHint: '매장명과 한글 주소로 검색합니다. 이동 전 지점과 영업시간을 확인해 주세요.',
    freeTime: '자유시간에 둘러보기', scheduleNote: '중앙로·은행동 쇼핑 정보를 확인하세요. 방문 시간은 자유롭게 선택할 수 있습니다.',
    viewGuide: '쇼핑 가이드 보기', filmingLink: '대전근현대사전시관 · 촬영 장면 보기', brandImage: '공식 브랜드 이미지',
    count: '곳', external: '새 탭에서 열림', backSchedule: '11월 10일 일정 보기'
  },
  en: {
    shopping: 'Shopping Guide', shoppingTitle: 'Daejeon Shopping Guide', shoppingEyebrow: 'Everyday finds · Jungang-ro & Eunhaeng-dong',
    shoppingIntro: 'Discover Daejeon’s signature bread, Korean beauty and travel essentials. Find a shop for your free time.',
    all: 'All', bakery: 'Bakery & Local Food', beauty: 'K-Beauty & Cosmetics', essentials: 'Daily Essentials',
    filters: 'Shopping categories', openMap: 'Open in Naver Map', allMaps: 'View all shopping map links',
    mapsIntro: 'Choose a shop to open Naver Map in a new tab.', address: 'Address', sources: 'Store information & image sources',
    checked: 'Store information checked', mapHint: 'Search uses the store name and Korean address. Check the branch and opening hours before you go.',
    freeTime: 'Explore during your free time', scheduleNote: 'Browse shops around Jungang-ro and Eunhaeng-dong at a time that suits you.',
    viewGuide: 'Open Shopping Guide', filmingLink: 'Daejeon Modern History Exhibition Hall · Filmed Here', brandImage: 'Official brand image',
    count: 'shops', external: 'opens in a new tab', backSchedule: 'View the November 10 schedule'
  },
  cn: {
    shopping: '购物指南', shoppingTitle: '大田购物指南', shoppingEyebrow: '中央路 · 银行洞的日常好物',
    shoppingIntro: '从大田特色面包到韩国美妆和旅行必需品，利用自由时间寻找适合自己的店铺。',
    all: '全部', bakery: '面包店 · 地方美食', beauty: '韩妆 · 化妆品', essentials: '生活 · 旅行用品',
    filters: '购物类别', openMap: '在 Naver 地图中查看', allMaps: '查看全部购物地点的地图链接',
    mapsIntro: '选择店铺后，将在新标签页中打开 Naver 地图。', address: '地址', sources: '店铺信息 · 图片来源',
    checked: '店铺信息核对日期', mapHint: '使用店名和韩文地址搜索。出发前请核对分店及营业时间。',
    freeTime: '自由时间逛一逛', scheduleNote: '查看中央路、银行洞周边的购物信息，自由安排前往时间。',
    viewGuide: '打开购物指南', filmingLink: '大田近现代史展示馆 · 影视取景画面', brandImage: '官方品牌图片',
    count: '家店铺', external: '在新标签页中打开', backSchedule: '查看11月10日行程'
  },
  tw: {
    shopping: '購物指南', shoppingTitle: '大田購物指南', shoppingEyebrow: '中央路 · 銀行洞的日常好物',
    shoppingIntro: '從大田特色麵包到韓國美妝與旅行必需品，利用自由時間尋找適合自己的店舖。',
    all: '全部', bakery: '麵包店 · 在地美食', beauty: '韓系美妝 · 化妝品', essentials: '生活 · 旅行用品',
    filters: '購物類別', openMap: '在 Naver 地圖中查看', allMaps: '查看全部購物地點的地圖連結',
    mapsIntro: '選擇店舖後，將在新分頁開啟 Naver 地圖。', address: '地址', sources: '店舖資訊 · 圖片來源',
    checked: '店舖資訊核對日期', mapHint: '以店名和韓文地址搜尋。出發前請核對分店與營業時間。',
    freeTime: '自由時間逛一逛', scheduleNote: '查看中央路、銀行洞周邊的購物資訊，自由安排前往時間。',
    viewGuide: '開啟購物指南', filmingLink: '大田近現代史展示館 · 影視取景畫面', brandImage: '官方品牌圖片',
    count: '間店舖', external: '在新分頁開啟', backSchedule: '查看11月10日行程'
  }
};

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
export const shopMapUrl = shop => shop.naverUrl || `https://map.naver.com/p/search/${encodeURIComponent(shop.naverQuery)}`;
export function renderShoppingGuide(shops, lang, filter = 'all') {
  const c = shoppingCopy[lang] || shoppingCopy.ko;
  const local = value => typeof value === 'string' ? value : value?.[lang] || value?.ko || '';
  const mapLink = (shop, cls = 'button button-primary shopping-map-button') => `<a class="${cls}" href="${escape(shopMapUrl(shop))}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">📍</span> ${escape(c.openMap)}<span class="sr-only"> · ${escape(c.external)}</span></a>`;
  const visible = shops.filter(shop => filter === 'all' || shop.category === filter);
  return `<div class="page-container shopping-page">
    <div class="page-heading"><p class="eyebrow">${escape(c.shoppingEyebrow)}</p><h1>${escape(c.shoppingTitle)}</h1><p class="intro">${escape(c.shoppingIntro)}</p></div>
    <details class="shopping-all-maps"><summary>📍 ${escape(c.allMaps)}</summary><div class="shopping-map-list"><p>${escape(c.mapsIntro)}</p>${shops.map(shop => `<a href="${escape(shopMapUrl(shop))}" target="_blank" rel="noopener noreferrer"><strong>${escape(local(shop.names))}</strong><span lang="ko">${escape(shop.address.ko)}</span><span class="sr-only">${escape(c.external)}</span><span aria-hidden="true">↗</span></a>`).join('')}</div></details>
    <div class="shopping-toolbar"><div class="shopping-filters" role="group" aria-label="${escape(c.filters)}">${['all', 'bakery', 'beauty', 'essentials'].map(key => `<button type="button" data-action="shopping-filter" data-filter="${key}" aria-pressed="${key === filter}">${escape(c[key])}</button>`).join('')}</div><p class="shopping-count" role="status" aria-live="polite">${visible.length} ${escape(lang === 'en' && visible.length === 1 ? 'shop' : c.count)}</p></div>
    <div class="shopping-grid">${visible.map(shop => `<article class="shopping-card" data-shop-id="${escape(shop.id)}">
      <div class="shopping-photo ${shop.image.kind === 'brand' ? 'shopping-brand' : ''}"><img src="${escape(shop.image.src)}" alt="${escape(local(shop.image.alt))}" width="${shop.image.width}" height="${shop.image.height}" loading="lazy" decoding="async">${shop.image.kind === 'brand' ? `<span class="shopping-image-label">${escape(c.brandImage)}</span>` : ''}</div>
      <div class="shopping-card-body"><p class="category">${escape(c[shop.category])}</p><h2>${escape(local(shop.names))}</h2>${lang !== 'ko' ? `<p class="korean-name" lang="ko">${escape(shop.koreanName)}</p>` : ''}<p class="shopping-description">${escape(local(shop.description))}</p>${shop.note ? `<p class="shopping-note">${escape(local(shop.note))}</p>` : ''}<div class="shopping-address"><span class="small-label">${escape(c.address)}</span><p>${escape(local(shop.address))}</p>${lang !== 'ko' ? `<p lang="ko">${escape(shop.address.ko)}</p>` : ''}</div>${mapLink(shop)}
      <details class="shopping-sources"><summary>${escape(c.sources)}</summary><p>${escape(c.checked)} · ${escape(shop.verifiedAt)}</p>${shop.sources.map(source => `<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(local(source.label))} ↗<span class="sr-only"> · ${escape(c.external)}</span></a>`).join('')}</details></div></article>`).join('')}</div>
    <p class="shopping-map-hint">${escape(c.mapHint)}</p><a class="text-link" href="#/schedule/2026-11-10">${escape(c.backSchedule)} →</a>
  </div>`;
}
