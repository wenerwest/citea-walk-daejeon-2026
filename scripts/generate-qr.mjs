#!/usr/bin/env node
import { mkdir, readFile, writeFile, cp, stat } from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { encodeQR, svgForQR, pngForQR } from './qr-encoder.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
async function readJSON(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}
function publicURL(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Enter a confirmed HTTPS public site URL.'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash ||
      net.isIP(host) || host.startsWith('[') || !host.includes('.') ||
      /(^|\.)(localhost|local|test|invalid|example|internal)$/.test(host) ||
      /^(?:example\.(?:com|net|org)|(?:www\.)?your[-.]|username\.|owner\.)/.test(host) ||
      /(?:<|>|%3c|%3e|YOUR_|REPLACE|PLACEHOLDER)/i.test(url.href)) {
    throw new Error('QR blocked: use the actual public HTTPS URL; placeholders, localhost, private hosts, IPs and query/hash URLs are not accepted.');
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url;
}
try {
  const site = await readJSON(path.join(root, 'public/data/site.json'), {});
  const urlIndex = args.indexOf('--url');
  const value = urlIndex < 0 ? (site.publicUrl || site.deploymentUrl) : args[urlIndex + 1];
  if (!value) {
    console.log('QR not generated: the public deployment URL is not confirmed. Set public/data/site.json publicUrl, or pass --url https://ACTUAL-PUBLIC-SITE/.');
    process.exitCode = 0;
  } else {
    const base = publicURL(value);
    const data = await readJSON(path.join(root, 'public/data/places.json'), []);
    const places = Array.isArray(data) ? data : data.places || [];
    const entries = [{ name: 'main', url: base.href }];
    for (const lang of ['ko', 'tw', 'cn']) {
      const home = new URL(base); home.searchParams.set('lang', lang);
      entries.push({ name: `main-${lang}`, url: home.href });
      for (const place of places) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(place.id || '')) throw new Error(`Invalid place id: ${place.id}`);
        const target = new URL(home); target.hash = `/place/${place.id}`;
        entries.push({ name: `${place.id}-${lang}`, url: target.href, placeId: place.id, lang });
      }
    }
    // Encode every entry before writing anything; invalid/oversized URLs produce no partial set.
    const encoded = entries.map(entry => ({ entry, matrix: encodeQR(entry.url) }));
    const output = path.join(root, 'public/qr');
    await mkdir(output, { recursive: true });
    for (const { entry, matrix } of encoded) {
      await writeFile(path.join(output, `${entry.name}.svg`), svgForQR(matrix));
      await writeFile(path.join(output, `${entry.name}.png`), pngForQR(matrix));
    }
    await writeFile(path.join(output, 'manifest.json'), JSON.stringify({ publicUrl: base.href, generatedAt: new Date().toISOString(), entries }, null, 2) + '\n');
    try {
      if ((await stat(path.join(root, 'dist'))).isDirectory()) await cp(output, path.join(root, 'dist/qr'), { recursive: true, force: true });
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    console.log(`Generated ${entries.length} real QR targets as PNG and SVG in public/qr/.\nPublic target: ${base.href}\nScan main.png on a phone and confirm the live site before printing.`);
  }
} catch (error) {
  console.error(`QR generation failed: ${error.message}`); process.exitCode = 1;
}
