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
const langs = ['ko', 'tw', 'cn'];
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
    for (const lang of langs) if (typeof value[lang] !== 'string' || !value[lang].trim()) fail(`${label}.${lang}: all three languages need non-empty text.`);
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
    if (!langs.every(lang => locale[lang] && typeof locale[lang] === 'object' && !Array.isArray(locale[lang]))) fail('locale.json: ko, tw and cn must each contain a translation object.');
    const keys = new Set(langs.flatMap(lang => Object.keys(locale[lang])));
    for (const key of keys) for (const lang of langs) if (typeof locale[lang][key] !== 'string' || !locale[lang][key].trim()) fail(`locale.json: missing text ${lang}.${key}`);
  }
  const site = parsed.get('site.json');
  if (site?.hero?.src) await localAsset(site.hero.src, 'site.hero.src');
  const places = rows(parsed.get('places.json'), 'places');
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
  const days = Array.isArray(schedule) ? schedule : schedule?.days || schedule?.dates || schedule?.schedule || [];
  for (const day of days) {
    const date = day.date || day.id;
    if (date && !/^2026-11-(07|08|09|10)$/.test(date)) fail(`Schedule: date outside the event: ${date}`);
    for (const item of day.items || day.programs || []) {
      if (item.placeId && !ids.has(item.placeId)) fail(`schedule.json: unknown placeId ${item.placeId}`);
      if (item.time && !/^([01]\d|2[0-3]):[0-5]\d(?:\s*[–-]\s*([01]\d|2[0-3]):[0-5]\d)?$/.test(item.time)) fail(`schedule.json: use HH:MM or HH:MM–HH:MM for time: ${item.time}`);
    }
  }
  const appFiles = ['index.html', 'app.js', 'styles.css'];
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
      background_color: '#f8f5ed', theme_color: '#173c32',
    }, null, 2) + '\n');
  }
  const hash = createHash('sha256');
  for (const file of await filesUnder(dist)) { hash.update(path.relative(dist, file)); hash.update(await readFile(file)); }
  const buildId = hash.digest('hex').slice(0, 16);
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
