#!/usr/bin/env node
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public'), dist = path.join(root, 'dist');
const allowIncomplete = process.argv.includes('--allow-incomplete');
const exists = async file => { try { return (await stat(file)).isFile(); } catch { return false; } };
const fail = message => { throw new Error(message); };
const langs = ['ko', 'en', 'tw', 'cn'];
async function filesUnder(directory) {
  const list = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) fail(`Symbolic links cannot be deployed: ${path.relative(root, file)}`);
      if (entry.isDirectory()) list.push(...await filesUnder(file));
      else if (entry.isFile()) list.push(file);
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return list.sort();
}
function localized(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  if (langs.some(lang => typeof value[lang] === 'string')) {
    for (const lang of langs) if (typeof value[lang] !== 'string' || !value[lang].trim()) fail(`${label}.${lang}: all four languages need non-empty text.`);
  }
}
function localizedTree(value, label) {
  if (!value || typeof value !== 'object') return;
  localized(value, label);
  for (const [key, child] of Object.entries(value)) if (!langs.includes(key) && key !== 'audio') localizedTree(child, `${label}.${key}`);
}
async function localAsset(src, label, allowRemote = true) {
  if (!src) return;
  if (typeof src !== 'string') fail(`${label}: src must be text or null.`);
  if (allowRemote && /^https:\/\//.test(src)) return;
  if (/^(?:[a-z]+:|\/|\\)/i.test(src) || src.split(/[\\/]/).includes('..')) fail(`${label}: use a site-relative path such as audio/ko/place-id.mp3.`);
  if (!(await exists(path.join(publicDir, src)))) fail(`${label}: missing public/${src}`);
}
function rows(value, key) { return Array.isArray(value) ? value : value?.[key] || []; }

try {
  const publicFiles = await filesUnder(publicDir);
  const parsed = new Map();
  for (const file of publicFiles.filter(file => file.endsWith('.json'))) {
    let content;
    try { content = JSON.parse(await readFile(file, 'utf8')); }
    catch (error) { fail(`${path.relative(root, file)}: ${error.message}`); }
    localizedTree(content, path.relative(root, file));
    parsed.set(path.basename(file), content);
  }
  const locale = parsed.get('locale.json');
  if (locale) {
    if (!langs.every(lang => locale[lang] && typeof locale[lang] === 'object' && !Array.isArray(locale[lang]))) fail('locale.json: ko, en, tw and cn must each contain a translation object.');
    const keys = new Set(langs.flatMap(lang => Object.keys(locale[lang])));
    for (const key of keys) for (const lang of langs) if (typeof locale[lang][key] !== 'string' || !locale[lang][key].trim()) fail(`locale.json: missing text ${lang}.${key}`);
  }
  const site = parsed.get('site.json');
  if (site?.hero?.src) await localAsset(site.hero.src, 'site.hero.src');
  for (const logo of site?.footerLogos || []) await localAsset(logo.src, 'site.footerLogos.src');
  const places = rows(parsed.get('places.json'), 'places');
  const shops = parsed.get('shopping.json') || [];
  const shopIds = new Set();
  for (const shop of shops) {
    if (!shop.id || shopIds.has(shop.id)) fail('shopping.json: every shop needs a unique id.');
    shopIds.add(shop.id);
    if (!['bakery', 'beauty', 'essentials'].includes(shop.category)) fail(`shopping.${shop.id}: unknown category.`);
    if (!shop.address?.ko || !shop.naverQuery) fail(`shopping.${shop.id}: Korean address and map query are required.`);
    if (shop.naverUrl) {
      const url = new URL(shop.naverUrl);
      if (url.protocol !== 'https:' || !['naver.me', 'map.naver.com'].includes(url.hostname)) fail(`shopping.${shop.id}: use a verified Naver link.`);
    }
    if (!shop.image?.src) fail(`shopping.${shop.id}: an image is required.`);
    await localAsset(shop.image.src, `shopping.${shop.id}.image`, false);
  }
  const filmIds = new Set();
  for (const film of parsed.get('filming.json')?.works || []) {
    if (!film.id || filmIds.has(film.id)) fail('filming.json: every work needs a unique id.');
    filmIds.add(film.id);
    if (!Array.isArray(film.scenes)) fail(`filming.${film.id}: scenes must be an array, which may be empty.`);
    for (const [index, scene] of film.scenes.entries()) {
      if (!scene.src || !scene.width || !scene.height) fail(`filming.${film.id}.${index}: image path and dimensions are required.`);
      await localAsset(scene.src, `filming.${film.id}.${index}`, false);
      if (scene.original) await localAsset(scene.original, `filming.${film.id}.${index}.original`, false);
    }
  }
  const ids = new Set();
  for (const place of places) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(place.id || '')) fail('places.json: each place needs a unique lowercase-hyphen id.');
    if (ids.has(place.id)) fail(`places.json: duplicate place id ${place.id}`);
    ids.add(place.id);
    for (const [lang, audio] of Object.entries(place.audio || {})) {
      if (!langs.includes(lang)) fail(`${place.id}.audio: unsupported language ${lang}`);
      if (audio) await localAsset(typeof audio === 'string' ? audio : audio.src, `${place.id}.audio.${lang}`, false);
    }
    const image = typeof place.image === 'string' ? place.image : place.image?.src;
    if (image) await localAsset(image, `${place.id}.image`);
  }
  const schedule = parsed.get('schedule.json') || parsed.get('event.json');
  const checkIds = new Set();
  for (const item of schedule?.checklist || []) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id || '') || checkIds.has(item.id)) fail('checklist: each item needs a unique lowercase-hyphen id.');
    checkIds.add(item.id);
    if (item.app) {
      if (!item.app.icon) fail(`checklist.${item.id}: an app icon is required.`);
      await localAsset(item.app.icon, `checklist.${item.id}.app.icon`, false);
      for (const [platform, address] of Object.entries(item.app.downloads || {})) {
        const hosts = { android: 'play.google.com', ios: 'apps.apple.com' };
        let url;
        try { url = new URL(address); } catch { fail(`checklist.${item.id}: invalid ${platform} download link.`); }
        if (!hosts[platform] || url.protocol !== 'https:' || url.hostname !== hosts[platform]) fail(`checklist.${item.id}: use the official app store for ${platform}.`);
      }
    }
  }
  const days = Array.isArray(schedule) ? schedule : schedule?.days || schedule?.dates || schedule?.schedule || [];
  for (const day of days) {
    const date = day.date || day.id;
    if (date && !/^2026-11-(07|08|09|10)$/.test(date)) fail(`Schedule: date outside the event: ${date}`);
    for (const item of day.items || day.programs || []) {
      if (item.image) {
        if (!item.image.src) fail(`schedule.${item.id}: image.src is required.`);
        await localAsset(item.image.src, `schedule.${item.id}.image`);
      }
      if (item.mapUrl) {
        let url;
        try { url = new URL(item.mapUrl); } catch { fail(`schedule.${item.id}: invalid mapUrl.`); }
        if (url.protocol !== 'https:') fail(`schedule.${item.id}: mapUrl must use HTTPS.`);
      }
      if (item.placeId && !ids.has(item.placeId)) fail(`schedule.json: unknown placeId ${item.placeId}`);
      for (const placeId of item.relatedPlaceIds || []) if (!ids.has(placeId)) fail(`schedule.json: unknown related placeId ${placeId}`);
      if (item.time && !/^([01]\d|2[0-3]):[0-5]\d(?:\s*[–-]\s*([01]\d|2[0-3]):[0-5]\d)?$/.test(item.time)) fail(`schedule.json: use HH:MM or HH:MM–HH:MM for time: ${item.time}`);
    }
  }
  const appFiles = ['index.html', 'app.js', 'styles.css', 'shopping-guide.js', 'shopping-guide.css', 'filmed-here.js', 'filmed-here.css'];
  const missing = [];
  for (const file of appFiles) if (!(await exists(path.join(root, file)))) missing.push(file);
  if (missing.length && !allowIncomplete) fail(`Application files are not ready: ${missing.join(', ')}. Finish the app, then build again.`);
  if (missing.length) console.warn(`Incomplete preview build; missing: ${missing.join(', ')}`);
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await cp(publicDir, dist, { recursive: true, force: true });
  for (const file of [...appFiles, 'manifest.webmanifest', 'sw.js']) {
    if (await exists(path.join(root, file))) await cp(path.join(root, file), path.join(dist, file));
  }
  if (!(await exists(path.join(dist, 'manifest.webmanifest')))) {
    await writeFile(path.join(dist, 'manifest.webmanifest'), JSON.stringify({
      name: 'CiTEA Walk in Junggu, Daejeon 2026', short_name: 'CiTEA Walk',
      start_url: './', scope: './', display: 'browser',
      background_color: '#F9FBF8', theme_color: '#1C3A27',
    }, null, 2) + '\n');
  }
  const hash = createHash('sha256');
  for (const file of await filesUnder(dist)) { hash.update(path.relative(dist, file)); hash.update(await readFile(file)); }
  const buildId = hash.digest('hex').slice(0, 16);
  if (await exists(path.join(dist, 'index.html'))) {
    const html = await readFile(path.join(dist, 'index.html'), 'utf8');
    const versioned = html.replace(/(\s(?:src|href)\s*=\s*)(["'])((?:\.\/)?(?:(?:app|shopping-guide|filmed-here)\.js|(?:styles|shopping-guide|filmed-here)\.css|manifest\.webmanifest|assets\/fonts\/fonts\.css|assets\/icons\/[a-z0-9-]+\.(?:png|ico))(?:[?#][^"']*)?)\2/g, (_match, attribute, quote, reference) => {
      const hashIndex = reference.indexOf('#');
      const fragment = hashIndex === -1 ? '' : reference.slice(hashIndex);
      const withoutFragment = hashIndex === -1 ? reference : reference.slice(0, hashIndex);
      const queryIndex = withoutFragment.indexOf('?');
      const file = queryIndex === -1 ? withoutFragment : withoutFragment.slice(0, queryIndex);
      const query = new URLSearchParams(queryIndex === -1 ? '' : withoutFragment.slice(queryIndex + 1).replaceAll('&amp;', '&'));
      query.set('v', buildId);
      return `${attribute}${quote}${file}?${query.toString().replaceAll('&', '&amp;')}${fragment}${quote}`;
    });
    await writeFile(path.join(dist, 'index.html'), versioned);
  }
  const entry = path.join(dist, 'app.js');
  if (await exists(entry)) {
    const js = await readFile(entry, 'utf8');
    await writeFile(entry, js.replace(/from '([.]\/(?:shopping-guide|filmed-here)[.]js)'/g, (_match, file) => `from '${file}?v=${buildId}'`));
  }
  if (await exists(path.join(dist, 'sw.js'))) {
    const worker = await readFile(path.join(dist, 'sw.js'), 'utf8');
    await writeFile(path.join(dist, 'sw.js'), worker.replaceAll('__BUILD_ID__', buildId));
  }
  await writeFile(path.join(dist, '.nojekyll'), '');
  await writeFile(path.join(dist, 'build-meta.json'), JSON.stringify({ buildId, placeCount: places.length, complete: !missing.length }, null, 2) + '\n');
  console.log(`Build ready: ${dist}\nValidated ${parsed.size} JSON files, ${places.length} places. Build ID: ${buildId}`);
} catch (error) {
  console.error(`Build failed: ${error.message}`); process.exitCode = 1;
}
