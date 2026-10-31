#!/usr/bin/env node
// Optional operational checks. The website itself has no external dependencies.
import { mkdir, writeFile, symlink, rm, mkdtemp } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { encodeQR, pngForQR, svgForQR } from './qr-encoder.mjs';
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = await mkdtemp(path.join(tmpdir(), 'citea-tool-check-'));
let server;
try {
  await mkdir(path.join(fixture, 'site'));
  const root = path.join(fixture, 'site');
  await writeFile(path.join(root, 'index.html'), 'hello');
  await writeFile(path.join(root, 'sample.mp3'), Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
  await writeFile(path.join(root, '.hidden'), 'secret');
  await writeFile(path.join(fixture, 'outside.txt'), 'secret');
  await symlink(path.join(fixture, 'outside.txt'), path.join(root, 'outside.txt'));
  const port = 20000 + Math.floor(Math.random() * 20000);
  server = spawn(process.execPath, [path.join(project, 'scripts/dev.mjs'), '--root', root, '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => {
    let errorText = '';
    const timer = setTimeout(() => reject(new Error('Preview server did not start.')), 10000);
    server.stdout.once('data', () => { clearTimeout(timer); resolve(); });
    server.stderr.on('data', chunk => { errorText += chunk; });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Preview exited (${code}): ${errorText.trim()}`)); });
    server.once('error', error => { clearTimeout(timer); reject(error); });
  });
  const base = `http://127.0.0.1:${port}`;
  let response = await fetch(base + '/');
  assert.equal(response.status, 200); assert.equal(await response.text(), 'hello');
  response = await fetch(base + '/sample.mp3', { headers: { Range: 'bytes=2-5' } });
  assert.equal(response.status, 206); assert.equal(response.headers.get('content-type'), 'audio/mpeg');
  assert.equal(response.headers.get('content-range'), 'bytes 2-5/10');
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [2, 3, 4, 5]);
  response = await fetch(base + '/sample.mp3', { headers: { Range: 'bytes=-3' } });
  assert.equal(response.status, 206); assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [7, 8, 9]);
  assert.equal((await fetch(base + '/sample.mp3', { headers: { Range: 'bytes=40-' } })).status, 416);
  response = await fetch(base + '/sample.mp3', { method: 'HEAD' });
  assert.equal(response.headers.get('content-length'), '10'); assert.equal((await response.arrayBuffer()).byteLength, 0);
  assert.equal((await fetch(base + '/.hidden')).status, 403);
  assert.equal((await fetch(base + '/outside.txt')).status, 404);
  assert.equal((await fetch(base + '/a%2f..%2fsecret')).status, 403);
  assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
  console.log('PASS: static preview, MP3 MIME, byte ranges, suffix ranges, 416, HEAD, traversal and symlink containment.');

  for (const value of ['http://citea.org/', 'https://localhost/', 'https://example.com/', 'https://192.168.0.1/', 'https://owner.github.io/', 'https://citea.invalid/']) {
    const result = spawnSync(process.execPath, [path.join(project, 'scripts/generate-qr.mjs'), '--url', value], { encoding: 'utf8' });
    assert.equal(result.status, 1, `Must reject ${value}`);
  }
  console.log('PASS: QR generator rejects local, non-HTTPS and placeholder URLs.');
  const decoderIndex = process.argv.indexOf('--decoder');
  if (decoderIndex >= 0) {
    const modules = path.resolve(process.argv[decoderIndex + 1]);
    const require = createRequire(path.join(modules, 'citea-decoder.cjs'));
    const jsQR = require('jsqr'), { PNG } = require('pngjs');
    for (const length of [13, 20, 40, 60, 90, 120, 150, 180, 210, 250]) {
      const value = 'https://x.io/' + 'a'.repeat(length - 13);
      const matrix = encodeQR(value), png = pngForQR(matrix, 8);
      const decodedPNG = PNG.sync.read(png);
      const decoded = jsQR(new Uint8ClampedArray(decodedPNG.data), decodedPNG.width, decodedPNG.height, { inversionAttempts: 'dontInvert' });
      assert.equal(decoded?.data, value, `Independent QR decode failed for ${length} bytes / version ${(matrix.length - 17) / 4}`);
      assert.match(svgForQR(matrix), /viewBox="0 0 \d+ \d+"/);
    }
    const value = 'https://x.io/guide/?lang=tw#/place/daejeon-traditional-narae-hall';
    const png = PNG.sync.read(pngForQR(encodeQR(value), 8));
    assert.equal(jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data, value);
    console.log('PASS: independent jsQR PNG decoding, versions 1–10 and language/place deep link.');
  } else console.log('QR independent decoder skipped. To verify: --decoder /path/to/node_modules containing jsqr and pngjs.');
} catch (error) {
  console.error(`Tool verification failed: ${error.message}`); process.exitCode = 1;
} finally {
  if (server) { const ended = new Promise(resolve => server.once('exit', resolve)); server.kill('SIGTERM'); if (server.exitCode === null) await ended; }
  await rm(fixture, { recursive: true, force: true });
}
