#!/usr/bin/env node
// Static preview, with byte ranges for real audio seeking. No packages required.
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
};
const port = Number(option('--port', process.env.PORT || '4173'));
const host = option('--host', '127.0.0.1');
const root = path.resolve(option('--root', args.includes('--dist') ? path.join(project, 'dist') : project));
const publicOverlay = !args.includes('--dist') && !args.includes('--root');
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Use --port 1–65535.');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
};
const inside = (candidate, directory) => candidate === directory || candidate.startsWith(directory + path.sep);

async function locate(relative) {
  const candidates = publicOverlay ? [path.resolve(root, 'public', relative), path.resolve(root, relative)] : [path.resolve(root, relative)];
  for (const candidate of candidates) {
    if (!inside(candidate, root)) continue;
    try {
      const resolved = await realpath(candidate);
      if (!inside(resolved, await realpath(root))) continue;
      const info = await stat(resolved);
      if (info.isFile()) return { file: resolved, info };
    } catch (error) {
      if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error;
    }
  }
  return null;
}

function rangeFor(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2]) || size === 0) return null;
  let start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  let end = match[2] && match[1] ? Math.min(size - 1, Number(match[2])) : size - 1;
  if (![start, end].every(Number.isSafeInteger) || start < 0 || start > end || start >= size) return null;
  return { start, end };
}

const server = http.createServer(async (req, res) => {
  try {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed'); return;
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400).end('Invalid path'); return; }
    if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').some(part => part === '..' || part.startsWith('.'))) {
      res.writeHead(403).end('Forbidden'); return;
    }
    const relative = pathname.endsWith('/') ? pathname.slice(1) + 'index.html' : pathname.slice(1);
    const found = await locate(relative);
    if (!found) { res.writeHead(404).end('Not found'); return; }
    const { file, info } = found;
    const headers = {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes',
      'Last-Modified': info.mtime.toUTCString(),
    };
    let start = 0, end = info.size - 1, status = 200;
    if (req.headers.range) {
      const range = rangeFor(req.headers.range, info.size);
      if (!range) { res.writeHead(416, { ...headers, 'Content-Range': `bytes */${info.size}` }).end(); return; }
      ({ start, end } = range); status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    }
    headers['Content-Length'] = status === 206 ? end - start + 1 : info.size;
    res.writeHead(status, headers);
    if (req.method === 'HEAD' || info.size === 0) { res.end(); return; }
    const stream = createReadStream(file, { start, end });
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  } catch (error) {
    console.error(error.message);
    if (!res.headersSent) res.writeHead(500).end('Preview error'); else res.destroy();
  }
});
server.listen(port, host, () => console.log(`CiTEA preview: http://${host}:${port}\nServing ${root}${publicOverlay ? ' (public/ assets at site root)' : ''}\nCtrl+C to stop.`));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
