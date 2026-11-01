import { shoppingCopy, renderShoppingGuide } from './shopping-guide.js';
import { initFilmedHere, renderFilmedHere, closeFilmedGallery } from './filmed-here.js';
const $ = (s, root = document) => root.querySelector(s);
const main = $('#main');
const engine = $('#audio-engine');
const langs = ['ko', 'en', 'tw', 'cn'];
const readStore = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const store = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
const params = new URL(location.href).searchParams;
let lang = langs.includes(params.get('lang')) ? params.get('lang') : readStore('citea-language', 'ko');
if (!langs.includes(lang)) lang = 'ko';
let data, activeTrack = null, menuOpen = false, cachedTracks = new Set(), shoppingFilter = 'all';
let checks = readStore('citea-checklist', {});
if (!checks || typeof checks !== 'object' || Array.isArray(checks)) checks = {};
const extra = {
  en: {"guide": "City Exploration Guide", "overview": "Journey at a glance", "fourDays": "Four days, at a slower pace", "all": "All", "sources": "Official references", "photoCredit": "Photo credit", "directionsPending": "Confirm your destination, then choose directions in NAVER Map.", "offline": "Offline · Showing saved information", "updated": "Connected · Check the latest information", "guideNumber": "Guide", "essentials": "Essentials before you set out", "localSaveFailed": "Browser storage is restricted, so your checklist selections cannot be saved.", "failed": "Could not copy. Press and hold the address to copy it.", "remove": "Remove", "savedGuide": "Previously opened guides are available offline. Maps and external links need an internet connection.", "search": "Find a place", "searchPlaceholder": "Place name or keyword", "noResults": "No places found.", "tourism": "City Travel Guide", "tourList": "This is the order of introduction, not the order of visits."},
  ko: { guide: '도시 탐방 가이드', overview: '여정 한눈에', fourDays: '나흘의 느린 여행', all: '전체', sources: '공식 참고 자료', photoCredit: '사진 출처', directionsPending: '목적지 확인 후 NAVER Map에서 길찾기를 선택해 주세요.', offline: '오프라인 · 저장된 안내를 표시합니다', updated: '연결됨 · 최신 안내를 확인하세요', guideNumber: '가이드', essentials: '출발 전, 꼭 챙겨요', localSaveFailed: '브라우저 저장이 제한되어 체크 상태를 유지할 수 없습니다.', failed: '복사하지 못했습니다. 주소를 길게 눌러 복사해 주세요.', remove: '삭제', savedGuide: '한 번 열어 본 안내는 오프라인에서도 볼 수 있습니다. 지도·외부 링크에는 인터넷이 필요합니다.', tourism: '도시 여행 가이드', search: '장소 찾기', searchPlaceholder:'장소명 또는 키워드', noResults:'검색 결과가 없습니다.', tourList:'소개 순서이며 실제 방문 순서가 아닙니다.' },
  tw: { guide: '城市漫遊指南', overview: '旅程一覽', fourDays: '四天，慢慢旅行', all: '全部', sources: '官方參考資料', photoCredit: '照片來源', directionsPending: '確認目的地後，請在NAVER Map選擇路線規劃。', offline: '離線中・顯示已儲存資訊', updated: '已連線・請留意最新資訊', guideNumber: '指南', essentials: '出發前，別忘了', localSaveFailed: '瀏覽器限制儲存，無法保留勾選狀態。', failed: '複製失敗，請長按地址複製。', remove: '移除', savedGuide: '曾開啟的指南可離線查看。地圖與外部連結仍需網路。', tourism: '城市旅行指南', search: '尋找地點', searchPlaceholder:'地點名稱或關鍵字', noResults:'找不到符合的地點。', tourList:'此為介紹順序，並非實際參訪順序。' },
  cn: { guide: '城市漫游指南', overview: '行程一览', fourDays: '四天，慢慢旅行', all: '全部', sources: '官方参考资料', photoCredit: '照片来源', directionsPending: '确认目的地后，请在NAVER Map选择路线规划。', offline: '离线中・显示已保存信息', updated: '已联网・请关注最新信息', guideNumber: '指南', essentials: '出发前，别忘了', localSaveFailed: '浏览器限制存储，无法保留勾选状态。', failed: '复制失败，请长按地址复制。', remove: '移除', savedGuide: '曾打开的指南可离线查看。地图与外部链接仍需网络。', tourism: '城市旅行指南', search: '查找地点', searchPlaceholder:'地点名称或关键词', noResults:'没有找到相关地点。', tourList:'此为介绍顺序，并非实际参访顺序。' }
};
const t = key => data?.locale[lang]?.[key] ?? extra[lang]?.[key] ?? shoppingCopy[lang]?.[key] ?? key;
const l = value => typeof value === 'string' ? value : value?.[lang] ?? '';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = (name, size=20) => {
  const paths = {
    arrow:'<path d="M4 12h16M14 6l6 6-6 6"/>', chevron:'<path d="m9 5 7 7-7 7"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-12 5h.01m5 0h.01"/>',
    pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    headphones:'<path d="M3 14v-3a9 9 0 0 1 18 0v3M3 13h4v8H5a2 2 0 0 1-2-2Zm18 0h-4v8h2a2 2 0 0 0 2-2Z"/>',
    check:'<path d="m5 12 4 4L19 6"/>', leaf:'<path d="M4 20C-2 2 14 2 21 3c0 13-5 18-17 17ZM4 20 16 8"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l1.5 1.5m13 13L20 20M4 20l1.5-1.5m13-13L20 4"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
    play:'<path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"/>', pause:'<path d="M8 5v14M16 5v14" stroke-width="4"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>', download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    walk:'<circle cx="14" cy="3" r="2"/><path d="m7 21 4-8m4 8-1-6-4-4 2-5 4 5h4M5 11l3-4h4"/>', search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>'
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.leaf}</svg>`;
};
const href = path => `#${path}`;
const link = (path, text, cls='', ico='arrow') => `<a class="${cls}" href="${href(path)}">${esc(text)}${ico?icon(ico):''}</a>`;
const safeUrl = value => { if(typeof value!=='string'||!value.trim())return ''; try { const u = new URL(value, document.baseURI); return ['http:','https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
const ext = (url, label, cls='text-link') => safeUrl(url) ? `<a class="${cls}" href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${esc(label)}${icon('arrow')}<span class="sr-only"> ${t('externalLink')}</span></a>` : '';
const byId = id => data?.places?.find(p=>p.id===id);
const route = () => location.hash.startsWith('#/') ? location.hash.slice(1).split('/').filter(Boolean) : [];
const naver = p => safeUrl(p.naverUrl) || (p.naverQuery ? `https://map.naver.com/p/search/${encodeURIComponent(p.naverQuery)}` : '');
const audioFile = (p, trackLang=lang) => { const a = p.audio?.[trackLang]; return typeof a==='string' ? a : a?.src || ''; };
const validAudio = (p, trackLang=lang) => { const file=audioFile(p,trackLang); return file && safeUrl(file) && new URL(file,document.baseURI).origin===location.origin; };
const notice = (title, body, style='') => `<div class="notice-box ${style}">${icon('info')}<div><strong>${esc(title)}</strong><p>${esc(body)}</p></div></div>`;
function photo(p, cls='', eager=false) {
  if (p?.image?.src) return `<div class="place-photo ${cls} ${p.image.fit==='contain'?'image-contain':''}"><img src="${esc(p.image.src)}" alt="${esc(l(p.image.alt))}" ${p.image.position?`style="object-position:${esc(p.image.position)}"`:''} ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async" width="${p.image.width||960}" height="${p.image.height||640}"></div>`;
  const id = p?.id || '';
  const ico = /park|uam|bomun/.test(id)?'leaf':/yoga|wellness/.test(id)?'sun':/bakery/.test(id)?'walk':'pin';
  return `<div class="place-photo photo-placeholder ${cls}"><span class="placeholder-icon">${icon(ico,40)}</span><span>${esc(t('photoPending'))}</span></div>`;
}
function renderHeader() {
  const current=route()[0]||'home';
  const items=['home','schedule','explore','shopping','audio','map','prepare','notices'];
  $('#header').innerHTML=`<div class="header-inner"><a class="brand" href="#/" aria-label="CiTEA Walk ${esc(t('home'))}"><span class="brand-logo"><img src="assets/citea-walk-logo.png" width="1422" height="736" alt="CiTEA Walk" decoding="async"></span><small class="brand-caption">JUNGGU, DAEJEON · 2026</small></a><nav class="desktop-nav" aria-label="${esc(t('menu'))}">${items.map(k=>`<a href="#/${k==='home'?'':k}" ${current===k||k==='explore'&&current==='place'?'aria-current="page"':''}>${esc(t(k))}</a>`).join('')}</nav><div class="header-actions"><div class="language-wrap" title="${esc(data.locale[lang].langName)}">${icon('globe',16)}<span class="language-code" aria-hidden="true">${lang.toUpperCase()}</span><label class="sr-only" for="language">${t('language')}</label><select id="language" aria-label="${t('language')}">${langs.map(x=>`<option value="${x}" ${lang===x?'selected':''}>${x.toUpperCase()} · ${data.locale[x].langName}</option>`).join('')}</select></div><button class="menu-button icon-button" data-action="menu" aria-expanded="${menuOpen}" aria-controls="mobile-nav" aria-label="${t(menuOpen?'closeMenu':'menu')}">${icon(menuOpen?'close':'menu')}</button></div></div><nav id="mobile-nav" class="mobile-nav" ${menuOpen?'':'hidden'} aria-label="${esc(t('menu'))}">${items.map(k=>`<a href="#/${k==='home'?'':k}" ${current===k?'aria-current="page"':''}>${esc(t(k))}${icon('chevron',16)}</a>`).join('')}</nav>`;
  $('#skip').textContent=t('skipToContent');
}
function footer() {
  $('#footer').innerHTML=`<div class="footer-inner"><div><a class="footer-brand" href="#/" aria-label="CiTEA Walk ${esc(t('home'))}"><span class="brand-logo"><img src="assets/citea-walk-logo.png" width="1422" height="736" alt="CiTEA Walk" loading="lazy" decoding="async"></span><span>${esc(t('tagline'))}</span></a><p>${esc(t('footerNote'))}</p></div><div class="footer-meta"><p>JUNGGU, DAEJEON · NOV 7–10, 2026</p><p>${esc(t('lastUpdated'))} ${esc(data.event.updatedAt)}</p><a href="#/notices">${esc(t('notices'))} ↗</a></div></div><div class="footer-institutions" aria-label="${esc(t('institutionLogos'))}">${(data.site.footerLogos||[]).map(logo=>`<img src="${esc(logo.src)}" alt="${esc(l(logo.alt))}" width="${logo.width}" height="${logo.height}" loading="lazy" decoding="async">`).join('')}</div><div class="footer-bottom"><span>© 2026 CiTEA Walk</span><span id="connection">${esc(t(navigator.onLine?'savedGuide':'offline'))}</span></div>`;
}
function pageHeading(kind) {
  return `<div class="page-heading"><p class="eyebrow">${esc(t(kind+'Eyebrow'))}</p><h1>${esc(t(kind+'Title'))}</h1><p class="intro">${esc(t(kind+'Intro'))}</p></div>`;
}
function dateCards(selected='', compact=false) {
  return `<div class="date-cards ${compact?'compact':''}" aria-label="${esc(t('selectDate'))}">${data.event.dates.map((d,i)=>`<a class="date-card ${d.id===selected?'selected':''}" href="#/schedule/${d.id}" ${d.id===selected?'aria-current="date"':''}><span class="date-top">DAY ${String(i+1).padStart(2,'0')}${icon('arrow',18)}</span><span class="date-number">11<span>/</span>${7+i}</span><span class="date-day">${['SAT','SUN','MON','TUE'][i]} <span>· ${esc(t(['daySat','daySun','dayMon','dayTue'][i]))}</span></span>${!compact?`<span class="date-status">${esc(t(d.items.length?'viewSchedule':'schedulePendingTitle'))}</span>`:''}</a>`).join('')}</div>`;
}
function placeCard(p, index) {
  return `<article class="place-card"><a href="#/place/${p.id}" class="photo-link" aria-label="${esc(l(p.names))}">${photo(p)}<span class="place-number">${String(index+1).padStart(2,'0')}</span></a><div class="place-card-body"><p class="category">${esc(l(p.category))}</p><h2><a href="#/place/${p.id}">${esc(l(p.names))}</a></h2>${lang!=='ko'?`<p class="korean-name">${esc(p.koreanName)}</p>`:''}<p>${esc(l(p.intro))}</p><div class="card-bottom">${link('/place/'+p.id,t('viewDetails'),'text-link')}${validAudio(p)?`<button class="icon-button" data-action="play" data-id="${p.id}" aria-label="${esc(t('listenAudio'))}">${icon('headphones')}</button>`:`<span class="status-subtle">${icon('headphones',14)} ${esc(t('pending'))}</span>`}</div></div></article>`;
}
function home() {
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const todayDate=data.event.dates.find(d=>d.id===today);
  const hero=data.site.hero;
  const featured=['uam','temiorae','yuseong-footbath'].map(byId).filter(Boolean);
  return `<div class="home-layout"><section class="hero"><div class="hero-copy"><p class="eyebrow"><span class="tiny-leaf">${icon('leaf',15)}</span> ${esc(t('guide'))}</p><div class="event-pill"><span></span> NOVEMBER 7–10, 2026</div><h1 lang="en" aria-label="${esc(t('tagline'))}">The Heart<br>of Daejeon:<br><em>Jung-gu.</em></h1><p class="hero-local">${esc(t('homeEyebrow'))}</p><p class="hero-description">${esc(t('homeIntro'))}</p>${link('/schedule',t('viewSchedule'),'button button-primary')}<div class="hero-bottom">${icon('pin',15)}<span>Jung-gu & beyond, Daejeon</span><span class="hero-line"></span><span>TEA · CULTURE · WELLNESS</span></div></div><div class="hero-visual"><img class="hero-image" src="${esc(hero.src)}" alt="${esc(l(hero.alt))}" width="1400" height="1600" fetchpriority="high"><div class="image-shade"></div><span class="hero-year">20<br>26</span><div class="hero-image-caption"><span>01 / DAEJEON</span><p>${esc(l(hero.caption))}</p></div><a class="walk-stamp" href="#/explore" aria-label="${esc(t('startExploring'))}">${icon('walk',32)}<span>TAKE A<br>SLOW WALK</span>${icon('arrow',18)}</a></div></section><section class="journey-section"><div class="section-title"><div><p class="eyebrow">YOUR FOUR-DAY JOURNEY</p><h2>${esc(t('fourDays'))}</h2></div><p class="muted">${esc(t('eventPeriod'))}</p></div>${dateCards()}</section><div class="home-utility"><section class="today-panel"><div class="utility-icon">${icon('calendar',23)}</div><div><h2>${esc(t('todayProgram'))}</h2><p>${esc(todayDate?l(todayDate.label)+' · '+(todayDate.items.length?l(todayDate.items[0].title):t('schedulePendingTitle')):t('todayOutsideEvent'))}</p></div>${link(todayDate?'/schedule/'+todayDate.id:'/schedule',t('viewSchedule'),'text-link')}</section><section class="home-notice"><span class="small-label">${esc(t('importantNotices'))}</span><h2>${esc(l(data.event.notices[0]?.title))}</h2>${link('/notices',t('viewAllNotices'),'text-link')}</section></div><section class="home-discover"><div class="section-title"><div><p class="eyebrow">PLACES & STORIES</p><h2>${esc(t('discoverPlaces'))}</h2></div>${link('/explore',t('viewAllPlaces'),'text-link')}</div><div class="place-grid">${featured.map((p)=>placeCard(p,data.places.indexOf(p))).join('')}</div></section><section class="prepare-banner"><div class="banner-icon">${icon('headphones',32)}</div><div><p class="eyebrow">BEFORE YOU GO</p><h2>${esc(t('homePrepareTitle'))}</h2><p>${esc(t('homePrepareBody'))}</p></div>${link('/prepare',t('openChecklist'),'button button-light')}</section><p class="photo-attribution">${esc(t('photoCredit'))}: ${ext(hero.source,hero.credit,'')} · ${ext(hero.license,'CC BY 2.0','')}</p></div>`;
}
function schedule(dateId) {
  const day=data.event.dates.find(d=>d.id===dateId)||data.event.dates[0];
  return `<div class="page-container">${pageHeading('schedule')}${dateCards(day.id,true)}<div class="schedule-heading"><h2>${esc(l(day.label))}</h2><span class="small-label">${esc(t('scheduleSource'))}</span></div>${day.items.length?`<div class="timeline">${day.items.map(item=>scheduleItem(item)).join('')}</div>`:`<section class="empty-state"><div class="empty-icon">${icon('calendar',32)}</div><h3>${esc(t('schedulePendingTitle'))}</h3><p>${esc(l(data.event.scheduleExplanation))}</p>${link('/notices',t('notices'),'text-link')}</section>`}${day.id==='2026-11-10'?shoppingScheduleLinks():''}<div class="section-spacer">${notice(t('meetingPoint'),l(day.meetingPoint)||t('meetingPending'))}</div>${data.event.scheduleSource?ext(data.event.scheduleSource,t('scheduleSource'),'button button-outline'):''}</div>`;
}
function shoppingScheduleLinks() {
  const c=shoppingCopy[lang];
  return `<aside class="schedule-shopping"><div><h2>${esc(c.freeTime)}</h2><p>${esc(c.scheduleNote)}</p></div>${link('/shopping',c.viewGuide,'button button-primary')}</aside><p class="schedule-filming">${link('/place/daejeon-modern-history',c.filmingLink,'text-link')}</p>`;
}
function shopping() { return renderShoppingGuide(data.shopping,lang,shoppingFilter); }
function scheduleItem(item) {
  const p=byId(item.placeId);
  const associated=[...new Set([item.placeId,...(item.relatedPlaceIds||[])])].map(byId).filter(Boolean);
  const venue=l(item.venue)||(p?.address?l(p.names):'');
  const mapUrl=safeUrl(item.mapUrl)||(item.mapQuery?`https://map.naver.com/p/search/${encodeURIComponent(item.mapQuery)}`:p?naver(p):'');
  const photoSource=item.image?.src?{image:item.image}:p;
  const hasPhoto=!!photoSource?.image?.src;
  return `<article class="timeline-item" id="${esc(item.id||'')}"><time class="timeline-time" datetime="${esc(item.time)}">${esc(item.time || t('toBeConfirmed'))}</time><div class="timeline-body ${hasPhoto?'has-photo':''}">${hasPhoto?photo(photoSource):''}<div>${venue?`<p class="category">${esc(venue)}</p>`:''}<h3>${esc(l(item.title))}</h3>${item.description?`<p>${esc(l(item.description))}</p>`:''}${item.meetingPoint?`<p>${esc(t('meetingPoint'))}: ${esc(l(item.meetingPoint))}</p>`:''}<div class="button-row">${associated.map(x=>link('/place/'+x.id,t('viewDetails')+(associated.length>1?' · '+l(x.names):''),'text-link')).join('')}${mapUrl?ext(mapUrl,t('openMap')):''}${p&&validAudio(p)?`<button class="text-link" data-action="play" data-id="${p.id}">${icon('headphones')}${esc(t('listenAudio'))}</button>`:''}</div></div></div></article>`;
}
function explore() {
  return `<div class="page-container">${pageHeading('explore')}<div class="explore-bar"><p>${data.places.length} ${esc(t('allPlaces'))}</p><label class="search-field">${icon('search',18)}<span class="sr-only">${esc(t('search'))}</span><input id="place-search" type="search" placeholder="${esc(t('searchPlaceholder'))}" autocomplete="off"></label></div><div class="place-grid explore-grid" id="place-results">${data.places.map(placeCard).join('')}</div><p id="no-results" hidden>${esc(t('noResults'))}</p><p class="muted list-note">${esc(t('tourList'))}</p></div>`;
}
function mapBlock(p) {
  return `<div class="map-detail"><div class="map-icon">${icon('pin',26)}</div><div><p class="small-label">${esc(t('address'))}</p><p class="address-text">${esc(l(p.address)||t('addressPending'))}</p>${lang!=='ko'&&p.address?`<p lang="ko" class="korean-name">${esc(p.address.ko)}</p>`:''}<p class="muted">${esc(l(p.meetingPoint)||t('meetingPending'))}</p><div class="button-row">${naver(p)?ext(naver(p),t(p.naverUrl?'openNaverMap':'searchNaverMap'),'button button-outline'):`<span class="badge">${esc(t('mapPending'))}</span>`}${p.directionsUrl?ext(p.directionsUrl,t('directions'),'text-link'):''}${p.address?`<button class="text-link" data-action="copy" data-id="${p.id}">${esc(t('copyAddress'))}</button>`:''}</div>${naver(p)&&!p.naverUrl?`<p class="microcopy">${esc(t('mapSearchHint'))}</p><p class="microcopy">${esc(t('directionsPending'))}</p>`:''}</div></div>`;
}
function audioBlock(p) {
  if (!validAudio(p)) return `<div class="audio-block is-pending">${icon('headphones',28)}<div><h3>${esc(t('audioPending'))}</h3><p>${esc(t('audioPendingBody'))}</p></div><span class="badge">${lang.toUpperCase()}</span></div>`;
  const src=audioFile(p), saved=cachedTracks.has(new URL(src,document.baseURI).href);
  return `<div class="audio-block"><button class="play-circle" data-action="play" data-id="${p.id}" aria-label="${esc(t('play'))} ${esc(l(p.names))}">${icon('play',24)}</button><div><h3>${esc(t('audioAvailable'))} <span class="badge">${lang.toUpperCase()}</span></h3><p>${esc(t('audioEarphones'))}</p><div class="button-row"><a class="text-link" href="${esc(src)}" download>${icon('download',16)}${esc(t('downloadAudio'))}</a><button class="text-link" data-action="cache" data-id="${p.id}">${icon(saved?'check':'download',16)}${esc(t(saved?'savedOffline':'saveOffline'))}</button>${saved?`<button class="text-link" data-action="uncache" data-id="${p.id}">${esc(t('remove'))}</button>`:''}</div></div></div>`;
}
function place(id) {
  const p=byId(id); if(!p) return notFound();
  const i=data.places.indexOf(p);
  return `<article class="page-container place-detail"><div class="breadcrumb">${link('/explore',t('backToExplore'),'text-link','')}<span>/ ${String(i+1).padStart(2,'0')}</span></div><div class="place-title"><p class="eyebrow">${esc(l(p.category))}</p><h1>${esc(l(p.names))}</h1>${lang!=='ko'?`<p class="native-title" lang="ko">${esc(p.koreanName)}</p>`:''}</div>${photo(p,'detail-photo',true)}${p.image?`<p class="photo-attribution">${p.image.source?ext(p.image.source,l(p.image.credit),''):esc(l(p.image.credit))} ${p.image.license?ext(p.image.license,'License',''):''}</p>`:''}<div class="detail-columns"><div class="detail-copy"><section><h2>${esc(t('placeIntro'))}</h2><p>${esc(l(p.intro))}</p></section><section><h2>${esc(t('background'))}</h2><p>${esc(l(p.history))}</p></section><section><h2>${esc(t('visitPurpose'))}</h2><p>${esc(l(p.purpose))}</p></section>${notice(t('verificationNote'),l(p.verificationNote),'verification')}<details class="sources"><summary>${esc(t('sources'))} (${p.sources.length})</summary>${p.sources.map(s=>ext(s.url,s.label)).join('')}</details></div><aside class="detail-sidebar"><h2>${esc(t('audio'))}</h2>${audioBlock(p)}<h2>${esc(t('practicalInfo'))}</h2>${mapBlock(p)}</aside></div>${p.id==='daejeon-modern-history'?renderFilmedHere(lang):''}<nav class="place-pagination" aria-label="${esc(t('explore'))}">${i>0?link('/place/'+data.places[i-1].id,t('previousPlace')+' · '+l(data.places[i-1].names),'prev-link',''): '<span></span>'}${i<data.places.length-1?link('/place/'+data.places[i+1].id,t('nextPlace')+' · '+l(data.places[i+1].names),'next-link'): '<span></span>'}</nav></article>`;
}
function audioPage() {
  return `<div class="page-container narrow">${pageHeading('audio')}${notice(t('audioEarphones'),t('audioNoAutoplay'),'green-note')}<div class="audio-list">${data.places.map((p,i)=>`<section class="audio-list-item"><div class="audio-list-title"><span>${String(i+1).padStart(2,'0')}</span><h2><a href="#/place/${p.id}">${esc(l(p.names))}</a></h2></div>${audioBlock(p)}</section>`).join('')}</div><div class="offline-explainer">${icon('download',24)}<div><h2>${esc(t('saveOffline'))}</h2><p>${esc(t('offlineHint'))}</p><p>${esc(t('downloadHint'))}</p><p>${esc(t('savedGuide'))}</p></div></div></div>`;
}
function mapPage() {
  return `<div class="page-container">${pageHeading('map')}<div class="map-grid">${data.places.map((p,i)=>`<article class="map-card"><div class="map-card-title"><span class="map-index">${String(i+1).padStart(2,'0')}</span><h2><a href="#/place/${p.id}">${esc(l(p.names))}</a></h2></div>${mapBlock(p)}</article>`).join('')}</div></div>`;
}
function checklistItem(item) {
  const app=item.app, descriptionId=`check-description-${item.id}`;
  const title=app?`<span class="check-app-title"><img class="app-icon" src="${esc(app.icon)}" alt="" width="72" height="72" loading="lazy" decoding="async"><strong>${esc(l(item.title))}</strong></span>`:`<strong>${esc(l(item.title))}</strong>`;
  const resources=app?`<div class="app-resources"><div class="app-description" id="${esc(descriptionId)}">${app.paragraphs?.length?app.paragraphs.map(p=>`<p>${esc(l(p))}</p>`).join(''):''}<p class="${app.paragraphs?.length?'app-preparation-note':''}">${esc(l(item.detail))}</p></div><p class="app-download-caption">${esc(t('appDownloads'))}</p><div class="app-downloads" role="group" aria-label="${esc(l(item.title)+' · '+t('appDownloads'))}">${[['android','androidDownload','Google Play'],['ios','iphoneDownload','App Store']].map(([platform,key,storeName])=>safeUrl(app.downloads?.[platform])?`<a class="button button-outline app-store-link" href="${esc(safeUrl(app.downloads[platform]))}" target="_blank" rel="noopener noreferrer" aria-label="${esc(l(item.title)+' · '+t(key)+' · '+storeName+' · '+t('externalLink'))}">${icon('download',20)}<span><span class="app-download-platform">${esc(t(key))}</span><span class="app-store-name">${storeName}</span></span>${icon('arrow',18)}</a>`:'').join('')}</div>${app.sources?.length?`<details class="sources app-sources"><summary>${esc(t('sources'))}</summary>${app.sources.map(s=>ext(s.url,l(s.title))).join('')}</details>`:''}</div>`:'';
  return `<article class="checklist-entry ${app?'has-app':''}" data-checklist-item="${esc(item.id)}"><label class="check-item ${checks[item.id]?'checked':''}"><input type="checkbox" data-check="${esc(item.id)}" ${checks[item.id]?'checked':''} ${app?`aria-describedby="${esc(descriptionId)}"`:''}><span class="custom-check">${icon('check',17)}</span><span class="check-copy"><span class="category">${esc(l(item.group))}${item.essential?` <span class="required">${esc(t('required'))}</span>`:''}</span>${title}${app?'':`<span class="check-description">${esc(l(item.detail))}</span>`}</span></label>${resources}</article>`;
}
function prepare() {
  const count=data.event.checklist.filter(x=>checks[x.id]).length;
  return `<div class="page-container narrow">${pageHeading('prepare')}<section class="checklist-progress"><div><span>${esc(t('checklistProgress'))}</span><strong id="check-count">${count} / ${data.event.checklist.length}</strong></div><progress id="check-progress" value="${count}" max="${data.event.checklist.length}" aria-label="${esc(t('checklistProgress'))}"></progress><p>${esc(t('checklistLocal'))}</p></section><div class="weather-note">${icon('sun',26)}<div><strong>0–11°C</strong><p>${esc(t('weatherReference'))}</p></div></div><section class="checklist" aria-label="${esc(t('checklist'))}">${data.event.checklist.map(checklistItem).join('')}</section><button class="text-link reset-checks" data-action="reset">${esc(t('resetChecklist'))}</button></div>`;
}
function notices() {
  return `<div class="page-container narrow">${pageHeading('notices')}<section class="notice-list">${data.event.notices.map(n=>`<article class="notice-article"><span class="badge ${n.type==='important'?'badge-important':''}">${esc(t(n.type))}</span><h2>${esc(l(n.title))}</h2><p>${esc(l(n.body))}</p></article>`).join('')}</section></div>`;
}
const notFound=()=>`<div class="page-container empty-state"><h1>${esc(t('notFound'))}</h1>${link('/',t('backHome'),'button button-primary')}</div>`;
function render({focus=false}={}) {
  if(!data) return;
  closeFilmedGallery({restoreFocus:false});
  const [page, id]=route();
  document.documentElement.lang=data.locale[lang].htmlLang;
  const title=page==='place'?l(byId(id)?.names):t(page||'home');
  document.title=`${title} · CiTEA Walk 2026`;
  document.querySelector('meta[name="description"]').content=l(data.event.description);
  renderHeader();
  main.innerHTML=({home, schedule:()=>schedule(id), explore, shopping, place:()=>place(id), audio:audioPage, map:mapPage, prepare, notices}[page||'home']||notFound)();
  footer(); renderPlayer();
  if(focus){window.scrollTo(0,0);main.focus({preventScroll:true});}
}
function toast(message) { const el=$('#toast'); el.textContent=message; el.classList.add('visible'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('visible'),4300); }
async function setLanguage(value) {
  if(!langs.includes(value)) return;
  lang=value;store('citea-language',lang);
  const u=new URL(location.href);u.searchParams.set('lang',lang);history.replaceState(null,'',u);
  render();
}
function formatTime(seconds){if(!Number.isFinite(seconds))return '0:00';seconds=Math.max(0,Math.floor(seconds));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
function renderPlayer() {
  const focusEl=document.activeElement, focusId=focusEl?.closest('#player') ? focusEl.id || focusEl.dataset.action : null;
  const el=$('#player'); el.hidden=!activeTrack;
  document.body.classList.toggle('has-player',!!activeTrack);
  if(!activeTrack) {el.innerHTML='';return;}
  el.setAttribute('aria-label',t('miniPlayer'));
  const p=byId(activeTrack.id);
  el.innerHTML=`<div class="player-inner"><button class="play-circle" data-action="toggle-audio" aria-label="${t(engine.paused?'play':'pause')}">${icon(engine.paused?'play':'pause',23)}</button><div class="player-track"><a href="#/place/${p.id}">${esc(p.names[activeTrack.lang])}</a><span>${esc(t('audio'))} · ${activeTrack.lang.toUpperCase()}</span></div><div class="player-seek"><label class="sr-only" for="seek">${esc(t('seek'))}</label><input id="seek" type="range" min="0" max="${Number.isFinite(engine.duration)?engine.duration:0}" value="${engine.currentTime}" step="0.1"><div><span id="elapsed" aria-label="${esc(t('elapsed'))}">${formatTime(engine.currentTime)}</span><span id="remaining" aria-label="${esc(t('remaining'))}">−${formatTime(engine.duration-engine.currentTime)}</span></div></div><label class="speed-control"><span class="sr-only">${esc(t('playbackSpeed'))}</span><select id="speed">${[.75,1,1.25,1.5,2].map(v=>`<option value="${v}" ${engine.playbackRate===v?'selected':''}>${v}×</option>`).join('')}</select></label><button class="icon-button player-close" data-action="stop" aria-label="${esc(t('stop'))}">${icon('close')}</button></div>`;
  if(focusId){const focusTarget=el.querySelector(`[id="${focusId}"], [data-action="${focusId}"]`);focusTarget?.focus({preventScroll:true});}
}
async function startAudio(p) {
  if(!p||!validAudio(p))return;
  if(activeTrack?.id===p.id&&activeTrack.lang===lang){if(engine.paused)await engine.play().catch(()=>toast(t('audioError')));else engine.pause();return;}
  activeTrack={id:p.id,lang}; engine.src=audioFile(p); engine.load(); renderPlayer();
  try {await engine.play();if('mediaSession' in navigator){navigator.mediaSession.metadata=new MediaMetadata({title:l(p.names),artist:'CiTEA Walk 2026',album:data.locale[lang].langName});}}
  catch{toast(t('audioError'));}
}
async function updateCached() {
  if(!('caches' in window))return;
  try{const c=await caches.open('citea-audio-v1');cachedTracks=new Set((await c.keys()).map(r=>r.url));}catch{}
}
async function cacheAudio(p, remove=false) {
  if(!p||!validAudio(p))return;
  if(!('caches' in window)||!navigator.serviceWorker?.controller){toast(t('offlineUnavailable'));return;}
  try {
    const c=await caches.open('citea-audio-v1'), url=new URL(audioFile(p),document.baseURI).href;
    if(remove)await c.delete(url);else{toast(t('saving'));const r=await fetch(url,{cache:'reload'});if(!r.ok||r.status!==200)throw Error('fetch');await c.put(url,r);}
    await updateCached();render();toast(t(remove?'removeOffline':'savedOffline'));
  }catch{toast(t('offlineSaveError'));}
}
engine.addEventListener('timeupdate',()=>{if($('#seek')){$('#seek').value=engine.currentTime;$('#elapsed').textContent=formatTime(engine.currentTime);$('#remaining').textContent='−'+formatTime(engine.duration-engine.currentTime);}});
for(const event of ['play','pause','loadedmetadata','ended','ratechange'])engine.addEventListener(event,renderPlayer);
engine.addEventListener('error',()=>{if(activeTrack)toast(t('audioError'));});
document.addEventListener('click',async e=>{
  if(e.target.closest('#skip')){e.preventDefault();main.focus({preventScroll:true});main.scrollIntoView({block:'start'});return;}
  if(e.target.closest('a[href^="#/"]')){menuOpen=false;}
  const b=e.target.closest('[data-action]');if(!b)return;
  const p=byId(b.dataset.id);
  switch(b.dataset.action){
    case 'shopping-filter':shoppingFilter=b.dataset.filter;main.innerHTML=shopping();main.querySelector(`[data-filter="${shoppingFilter}"]`)?.focus({preventScroll:true});break;
    case 'menu':menuOpen=!menuOpen;renderHeader();break;
    case 'play':await startAudio(p);break;
    case 'toggle-audio':if(engine.paused)await engine.play().catch(()=>toast(t('audioError')));else engine.pause();break;
    case 'stop':engine.pause();engine.removeAttribute('src');engine.load();activeTrack=null;renderPlayer();break;
    case 'cache':await cacheAudio(p);break;
    case 'uncache':await cacheAudio(p,true);break;
    case 'copy':try{await navigator.clipboard.writeText(p.address.ko);toast(t('copied'));}catch{toast(t('failed'));}break;
    case 'reset':checks={};store('citea-checklist',checks);render();break;
    case 'retry':location.reload();break;
  }
});
document.addEventListener('change',e=>{
  if(e.target.id==='language')setLanguage(e.target.value);
  if(e.target.id==='speed')engine.playbackRate=Number(e.target.value);
  if(e.target.dataset.check){checks[e.target.dataset.check]=e.target.checked;if(!store('citea-checklist',checks))toast(t('localSaveFailed'));e.target.closest('.check-item').classList.toggle('checked',e.target.checked);const count=data.event.checklist.filter(x=>checks[x.id]).length;$('#check-count').textContent=`${count} / ${data.event.checklist.length}`;$('#check-progress').value=count;}
});
document.addEventListener('input',e=>{
  if(e.target.id==='seek')engine.currentTime=Number(e.target.value);
  if(e.target.id==='place-search'){const q=e.target.value.toLocaleLowerCase().trim();let visible=0;data.places.forEach((p,i)=>{const ok=JSON.stringify([p.names,p.koreanName,p.category]).toLocaleLowerCase().includes(q);$('#place-results').children[i].hidden=!ok;visible+=ok;});$('#no-results').hidden=visible>0;}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuOpen){menuOpen=false;renderHeader();$('.menu-button')?.focus();}});
window.addEventListener('hashchange',()=>render({focus:true}));
window.addEventListener('online',()=>{footer();toast(t('updated'));});window.addEventListener('offline',()=>{footer();toast(t('offline'));});
async function init(){
  try{
    const names=['locale','event','places','site','shopping'];const values=await Promise.all(names.map(async name=>{const r=await fetch(`data/${name}.json`,{cache:'no-cache'});if(!r.ok)throw Error(name);return r.json();}));data=Object.fromEntries(names.map((name,i)=>[name,values[i]]));
    store('citea-language',lang);await Promise.all([updateCached(),initFilmedHere({getLanguage:()=>lang})]);render();
    if(data.site.publicUrl){let canonical=document.createElement('link');canonical.rel='canonical';canonical.href=data.site.publicUrl;document.head.append(canonical);}
    if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }catch{main.innerHTML='<div class="empty-state"><h1>안내를 불러오지 못했습니다 / 無法載入 / 无法加载</h1><button class="button button-primary" data-action="retry">다시 시도 / 重試 / 重试</button></div>';}
}
init();
