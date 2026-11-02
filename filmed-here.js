const text = {
  ko: { heading:'이곳에서 촬영된 작품', intro:'작품 카드를 눌러 대전근현대사전시관이 등장한 실제 드라마 장면을 만나보세요.', open:'장면 갤러리 열기', scenes:'장', previous:'이전 장면', next:'다음 장면', close:'갤러리 닫기', expand:'사진을 눌러 전체 화면으로 보기', collapse:'확대 화면 닫기', pending:'실제 촬영 장면 사진을 준비 중입니다.', hint:'좌우 화살표 또는 스와이프로 장면을 바꿀 수 있습니다.', supplied:'사용자가 제공한 실제 드라마 장면' },
  en: { heading:'Filmed Here', intro:'Choose a title to see actual drama scenes filmed at the Daejeon Modern and Contemporary History Exhibition Hall.', open:'Open scene gallery', scenes:'scenes', previous:'Previous scene', next:'Next scene', close:'Close gallery', expand:'Select the photo to view full screen', collapse:'Exit enlarged view', pending:'Actual filming scene photos will be added here.', hint:'Use the arrows or swipe to change scenes.', supplied:'Actual drama scenes supplied by the user' },
  tw: { heading:'在此拍攝的作品', intro:'點選作品卡片，欣賞大田近現代史展示館出現的真實戲劇場景。', open:'開啟劇照圖集', scenes:'張劇照', previous:'上一張劇照', next:'下一張劇照', close:'關閉圖集', expand:'點選照片以全螢幕檢視', collapse:'結束放大檢視', pending:'實際拍攝場景照片準備中，之後將新增於此。', hint:'使用左右箭頭或滑動切換劇照。', supplied:'使用者提供的真實戲劇場景' },
  cn: { heading:'在此拍摄的作品', intro:'点击作品卡片，欣赏大田近现代史展示馆出现的真实剧集场景。', open:'打开剧照图库', scenes:'张剧照', previous:'上一张剧照', next:'下一张剧照', close:'关闭图库', expand:'点击照片以全屏查看', collapse:'退出放大查看', pending:'实际拍摄场景照片准备中，之后将在此添加。', hint:'使用左右箭头或滑动切换剧照。', supplied:'用户提供的真实剧集场景' }
};
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const localized = (value, lang) => typeof value === 'string' ? value : value?.[lang] || value?.en || value?.ko || '';
const arrow = direction => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="${direction==='left'?'m15 5-7 7 7 7':'m9 5 7 7-7 7'}"/></svg>`;
let films = [], dialog, initialized = false, getLanguage = () => 'ko';
let activeFilm = null, sceneIndex = 0, previousFocus = null, previousOverflow = '', expanded = false, touch = null, suppressClickUntil = 0;
const ui = () => text[getLanguage()] || text.ko;

export async function initFilmedHere(options = {}) {
  getLanguage = options.getLanguage || getLanguage;
  if (initialized) return;
  const response = await fetch('data/filming.json', {cache:'no-cache'});
  if (!response.ok) throw new Error('Could not load filming galleries');
  films = (await response.json()).works || [];
  dialog = document.createElement('dialog');
  dialog.id = 'filmed-gallery';
  dialog.className = 'film-dialog';
  dialog.setAttribute('aria-labelledby', 'film-gallery-title');
  dialog.setAttribute('aria-describedby', 'film-gallery-description');
  document.body.append(dialog);
  document.addEventListener('click', event => {
    const card = event.target.closest('[data-film-id]');
    if (card) openGallery(card.dataset.filmId, card);
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) return closeFilmedGallery();
    const action = event.target.closest('[data-film-action]')?.dataset.filmAction;
    if (action === 'close') closeFilmedGallery();
    if (action === 'previous') changeScene(-1);
    if (action === 'next') changeScene(1);
    if (action === 'expand' && Date.now() > suppressClickUntil) toggleExpanded();
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    if (expanded) leaveExpanded(); else closeFilmedGallery();
  });
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    document.body.style.overflow = previousOverflow;
    activeFilm = null;
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {event.preventDefault();changeScene(-1);}
    if (event.key === 'ArrowRight') {event.preventDefault();changeScene(1);}
    if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll('button:not(:disabled),a[href]')]
        .filter(control => !control.closest('[hidden]') && control.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {event.preventDefault();last?.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first?.focus();}
    }
  });
  dialog.addEventListener('touchstart', event => {
    touch = null;
    if (!event.target.closest('.film-gallery-image') || event.touches.length !== 1) return;
    touch = {x:event.touches[0].clientX,y:event.touches[0].clientY};
  }, {passive:true});
  dialog.addEventListener('touchcancel', () => {touch = null;}, {passive:true});
  dialog.addEventListener('touchend', event => {
    if (!touch || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touch.x, dy = event.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      suppressClickUntil = Date.now() + 500;
      changeScene(dx < 0 ? 1 : -1);
    }
  }, {passive:true});
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && expanded) {
      expanded = false;
      updateExpansion();
    }
  });
  window.addEventListener('hashchange', () => closeFilmedGallery({restoreFocus:false}));
  initialized = true;
}

export function renderFilmedHere(lang = 'ko') {
  const strings = text[lang] || text.ko;
  return `<section class="filmed-here" aria-labelledby="filmed-here-heading"><div class="film-section-heading"><p class="eyebrow">FILMED HERE</p><h2 id="filmed-here-heading">${escapeHtml(strings.heading)}</h2><p>${escapeHtml(strings.intro)}</p></div><div class="film-card-grid">${films.map(film => {
    const scene = film.scenes?.[0];
    return `<button type="button" class="film-card" data-film-id="${escapeHtml(film.id)}" aria-label="${escapeHtml(localized(film.title,lang)+' · '+strings.open)}">${scene?`<span class="film-card-photo"><img src="${escapeHtml(scene.src)}" alt="${escapeHtml(localized(scene.alt,lang))}" width="${scene.width}" height="${scene.height}" loading="lazy" decoding="async"><span class="film-card-count">${film.scenes.length} ${escapeHtml(strings.scenes)}</span></span>`:`<span class="film-card-photo film-card-pending">${escapeHtml(strings.pending)}</span>`}<span class="film-card-copy"><strong>${escapeHtml(localized(film.title,lang))}</strong><span>${escapeHtml(localized(film.description,lang))}</span><span class="film-card-open">${escapeHtml(strings.open)} ${arrow('right')}</span></span></button>`;
  }).join('')}</div></section>`;
}

function openGallery(id, trigger) {
  const film = films.find(item => item.id === id);
  if (!film || !dialog) return;
  if (dialog.open) closeFilmedGallery({restoreFocus:false});
  activeFilm = film;
  sceneIndex = 0;
  previousFocus = trigger || document.activeElement;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  expanded = false;
  touch = null;
  suppressClickUntil = 0;
  const strings = ui(), lang = getLanguage(), hasScenes = !!film.scenes?.length;
  dialog.innerHTML = `<div class="film-dialog-surface"><div class="film-dialog-toolbar"><span class="film-dialog-label">FILMED HERE</span><div><button type="button" class="film-expand-control" data-film-action="expand" aria-pressed="false" ${hasScenes?'':'hidden'} aria-label="${escapeHtml(strings.expand)}">⤢</button><button type="button" class="film-close-control" data-film-action="close" aria-label="${escapeHtml(strings.close)}">×</button></div></div>${hasScenes?`<div class="film-gallery-stage"><button type="button" class="film-gallery-arrow film-gallery-previous" data-film-action="previous" aria-label="${escapeHtml(strings.previous)}" ${film.scenes.length<2?'hidden':''}>${arrow('left')}</button><button type="button" class="film-gallery-image" data-film-action="expand" aria-label="${escapeHtml(strings.expand)}"><img id="film-gallery-photo" alt=""></button><button type="button" class="film-gallery-arrow film-gallery-next" data-film-action="next" aria-label="${escapeHtml(strings.next)}" ${film.scenes.length<2?'hidden':''}>${arrow('right')}</button></div>`:`<div class="film-gallery-empty">${escapeHtml(strings.pending)}</div>`}<div class="film-gallery-caption"><p class="film-gallery-count" id="film-gallery-count" aria-live="polite" aria-atomic="true"></p><h2 id="film-gallery-title">${escapeHtml(localized(film.title,lang))}</h2><p id="film-gallery-description">${escapeHtml(localized(film.description,lang))}</p>${hasScenes?`<p class="film-gallery-help">${escapeHtml(strings.expand)}${film.scenes.length>1?' · '+escapeHtml(strings.hint):''}</p>`:''}${hasScenes?`<p class="film-gallery-credit">${escapeHtml(strings.supplied)}</p>`:''}</div></div>`;
  updateScene();
  dialog.showModal();
  dialog.querySelector('[data-film-action="close"]').focus();
}

function updateScene() {
  const scene = activeFilm?.scenes?.[sceneIndex];
  if (!scene) return;
  const img = dialog.querySelector('#film-gallery-photo');
  img.src = scene.src;
  img.alt = localized(scene.alt,getLanguage());
  img.width = scene.width;
  img.height = scene.height;
  dialog.querySelector('#film-gallery-count').textContent = `${sceneIndex+1} / ${activeFilm.scenes.length}`;
}
function changeScene(delta) {
  if (!activeFilm?.scenes?.length || activeFilm.scenes.length < 2) return;
  sceneIndex = (sceneIndex + delta + activeFilm.scenes.length) % activeFilm.scenes.length;
  updateScene();
}
function updateExpansion() {
  dialog.classList.toggle('is-expanded',expanded);
  const control = dialog.querySelector('.film-expand-control');
  if (control) {
    control.textContent = expanded ? '⤡' : '⤢';
    control.setAttribute('aria-label',expanded ? ui().collapse : ui().expand);
    control.setAttribute('aria-pressed',String(expanded));
  }
  dialog.querySelector('.film-gallery-image')?.setAttribute('aria-label',expanded ? ui().collapse : ui().expand);
}
async function leaveExpanded() {
  expanded = false;
  updateExpansion();
  if (document.fullscreenElement && dialog.contains(document.fullscreenElement)) {
    try {await document.exitFullscreen();} catch {}
  }
}
async function toggleExpanded() {
  if (!activeFilm?.scenes?.length) return;
  if (expanded) return leaveExpanded();
  expanded = true;
  updateExpansion();
  // Keep viewport expansion on phones, including browsers without stable element fullscreen.
  if (window.matchMedia('(max-width: 900px), (max-height: 500px)').matches) return;
  const surface = dialog.querySelector('.film-dialog-surface');
  if (surface.requestFullscreen) {
    try {await surface.requestFullscreen();} catch { /* Viewport expansion remains available. */ }
  }
}
export function closeFilmedGallery({restoreFocus=true} = {}) {
  if (!dialog?.open) return;
  leaveExpanded();
  dialog.close();
  touch = null;
  document.body.style.overflow = previousOverflow;
  activeFilm = null;
  if (restoreFocus && previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
  previousFocus = null;
}
