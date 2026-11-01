const localized = (ko, en, cn, tw) => ({ ko, en, cn, tw });

export const scheduleTracks = {
  creators: {
    id: 'creators',
    dates: ['2026-11-07', '2026-11-08'],
    name: localized('크리에이터 일정', 'Creator Schedule', '创作者行程', '創作者行程'),
    audience: localized(
      '중화권 MZ 디지털 크리에이터',
      'MZ digital creators from Chinese-speaking regions',
      '华语地区 MZ 数字创作者',
      '華語地區 MZ 數位創作者'
    ),
    period: localized('11월 7–8일 · 2일', 'November 7–8 · 2 days', '11月7–8日 · 2天', '11月7–8日 · 2天')
  },
  partners: {
    id: 'partners',
    dates: ['2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'],
    name: localized(
      '여행사·커뮤니티 운영자 일정',
      'Travel Agency & Community Operator Schedule',
      '旅行社及社群运营者行程',
      '旅行社及社群經營者行程'
    ),
    audience: localized(
      '중화권 여행사·대형 커뮤니티 운영자',
      'Travel agencies and large community operators from Chinese-speaking regions',
      '华语地区旅行社及大型社群运营者',
      '華語地區旅行社及大型社群經營者'
    ),
    period: localized('11월 7–10일 · 4일', 'November 7–10 · 4 days', '11月7–10日 · 4天', '11月7–10日 · 4天')
  }
};

export const scheduleTrackCopy = {
  ko: {
    title: '참가 유형별 일정',
    intro: '참가 유형을 선택해 나의 일정을 확인하세요.',
    shared: '11월 7–8일 세부 프로그램과 시간은 두 그룹이 동일합니다.',
    view: '일정 보기',
    change: '다른 참가 유형 보기',
    current: '현재 참가 일정',
    choose: '참가 유형 선택'
  },
  en: {
    title: 'Schedules by Participant Type',
    intro: 'Choose your participant type to see your schedule.',
    shared: 'Both groups share the same programs and times on November 7–8.',
    view: 'View schedule',
    change: 'View other participant types',
    current: 'Your selected schedule',
    choose: 'Choose participant type'
  },
  cn: {
    title: '按参与类型查看行程',
    intro: '请选择参与类型，查看适合您的行程。',
    shared: '两组在11月7–8日的具体活动和时间完全相同。',
    view: '查看行程',
    change: '查看其他参与类型',
    current: '当前参与行程',
    choose: '选择参与类型'
  },
  tw: {
    title: '依參與類型查看行程',
    intro: '請選擇參與類型，查看適合您的行程。',
    shared: '兩組在11月7–8日的詳細活動與時間完全相同。',
    view: '查看行程',
    change: '查看其他參與類型',
    current: '目前參與行程',
    choose: '選擇參與類型'
  }
};

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const copyFor = lang => scheduleTrackCopy[lang] || scheduleTrackCopy.ko;
const textFor = (value, lang) => value?.[lang] || value?.ko || '';

export function renderScheduleTrackCards(lang, hrefForTrack) {
  const copy = copyFor(lang);
  return `<section class="schedule-tracks" aria-label="${escapeHtml(copy.choose)}">
    <div class="schedule-tracks-heading"><h2>${escapeHtml(copy.title)}</h2><p>${escapeHtml(copy.intro)}</p></div>
    <div class="schedule-track-grid">
      ${Object.values(scheduleTracks).map(track => `<a class="schedule-track-card" href="${escapeHtml(hrefForTrack(track.id))}" data-schedule-track="${escapeHtml(track.id)}">
        <span class="schedule-track-period">${escapeHtml(textFor(track.period, lang))}</span>
        <h3>${escapeHtml(textFor(track.name, lang))}</h3>
        <p class="schedule-track-audience">${escapeHtml(textFor(track.audience, lang))}</p>
        <span class="button button-primary schedule-track-view">${escapeHtml(copy.view)}<span aria-hidden="true">→</span></span>
      </a>`).join('')}
    </div>
    <p class="schedule-shared-note">${escapeHtml(copy.shared)}</p>
  </section>`;
}

export function renderScheduleTrackSummary(trackId, lang, chooseHref) {
  if (!Object.hasOwn(scheduleTracks, trackId)) return '';
  const track = scheduleTracks[trackId];
  const copy = copyFor(lang);
  return `<section class="schedule-track-summary" aria-label="${escapeHtml(copy.current)}">
    <div class="schedule-track-summary-copy"><p class="schedule-track-current">${escapeHtml(copy.current)}</p><h2>${escapeHtml(textFor(track.name, lang))}</h2><p class="schedule-track-audience">${escapeHtml(textFor(track.audience, lang))}</p><p class="schedule-track-period">${escapeHtml(textFor(track.period, lang))}</p></div>
    <a class="button button-outline schedule-track-change" href="${escapeHtml(chooseHref)}" data-action="choose-schedule-track">${escapeHtml(copy.change)}<span aria-hidden="true">→</span></a>
  </section>`;
}
