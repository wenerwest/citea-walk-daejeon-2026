export const exploreCategoryCopy = {
  ko: {
    title: '분류별 도시 탐방', filters: '탐방 분류', all: '전체',
    festival: '축제', wellness: '웰니스 체험', walking: '도보관광', visits: '방문답사', 'local-spaces': '로컬 스페이스',
    selected: '선택됨', count: '개'
  },
  en: {
    title: 'Explore by Category', filters: 'Exploration categories', all: 'All',
    festival: 'Festivals', wellness: 'Wellness Experiences', walking: 'Walking Tours', visits: 'Site Visits', 'local-spaces': 'Local Spaces',
    selected: 'Selected', count: 'items'
  },
  cn: {
    title: '按类别探索城市', filters: '城市探索类别', all: '全部',
    festival: '节庆', wellness: '康养体验', walking: '步行游览', visits: '参访考察', 'local-spaces': '本地空间',
    selected: '已选', count: '项'
  },
  tw: {
    title: '依類別探索城市', filters: '城市探索類別', all: '全部',
    festival: '節慶', wellness: '身心療癒體驗', walking: '步行導覽', visits: '參訪考察', 'local-spaces': '在地空間',
    selected: '已選', count: '項'
  }
};

export const exploreCategoryIds = Object.freeze(['festival', 'wellness', 'walking', 'visits', 'local-spaces']);

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const validCategory = id => exploreCategoryIds.includes(id);
const language = lang => Object.hasOwn(exploreCategoryCopy, lang) ? lang : 'ko';
const dot = id => `<span class="explore-category-dot explore-category-dot--${id}" aria-hidden="true"></span>`;

/** Render buttons only; the parent page owns selection, search and filtering. */
export function renderExploreCategoryFilters(places, lang = 'ko', selected = 'all') {
  const copy = exploreCategoryCopy[language(lang)];
  const items = Array.isArray(places) ? places : [];
  const active = selected === 'all' || validCategory(selected) ? selected : 'all';
  const counts = Object.fromEntries(exploreCategoryIds.map(id => [id, 0]));
  for (const place of items) if (validCategory(place?.categoryId)) counts[place.categoryId]++;
  counts.all = items.length;

  return `<div class="explore-category-filters" role="group" aria-label="${escape(copy.filters)}">${['all', ...exploreCategoryIds].map(id => {
    const pressed = id === active;
    return `<button type="button" class="explore-category-filter explore-category-tone--${id}${pressed ? ' is-selected' : ''}" data-explore-category="${id}" aria-pressed="${pressed}">${dot(id)}<span class="explore-category-filter-label">${escape(copy[id])}</span><span class="explore-category-count">${counts[id]}<span class="explore-category-sr-only"> ${escape(copy.count)}</span></span>${pressed ? `<span class="explore-category-selected"><span aria-hidden="true">✓</span> ${escape(copy.selected)}</span>` : ''}</button>`;
  }).join('')}</div>`;
}

/** Show a badge only for a supported category; use the place's translated label. */
export function renderExploreCategoryBadge(place, lang = 'ko') {
  if (!validCategory(place?.categoryId)) return '';
  const locale = language(lang);
  const value = place.category;
  const translated = typeof value === 'string' ? value : value?.[locale] || value?.ko || value?.en;
  const label = typeof translated === 'string' && translated.trim()
    ? translated
    : exploreCategoryCopy[locale][place.categoryId];
  return `<span class="explore-category-badge explore-category-tone--${place.categoryId}">${dot(place.categoryId)}<span>${escape(label)}</span></span>`;
}
