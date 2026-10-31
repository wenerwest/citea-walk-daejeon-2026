/*
 * Compact QR Model 2 byte encoder (versions 1–10, correction level L).
 * Matrix placement and Reed–Solomon implementation adapted from Project Nayuki:
 * https://www.nayuki.io/page/qr-code-generator-library
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { deflateSync } from 'node:zlib';

// [data codewords, error correction codewords per block, block count]
const PARAMETERS = [null, [19, 7, 1], [34, 10, 1], [55, 15, 1], [80, 20, 1],
  [108, 26, 1], [136, 18, 2], [156, 20, 2], [194, 24, 2], [232, 30, 2], [274, 18, 4]];
const ALIGNMENTS = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
const masks = [
  (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => x * y % 2 + x * y % 3 === 0,
  (x, y) => (x * y % 2 + x * y % 3) % 2 === 0,
  (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0,
];
function multiply(a, b) {
  let product = 0;
  for (let bit = 7; bit >= 0; bit--) {
    product = (product << 1) ^ ((product >>> 7) * 0x11d);
    product ^= ((b >>> bit) & 1) * a;
  }
  return product;
}
function errorCorrection(data, degree) {
  let polynomial = [1], root = 1;
  for (let i = 0; i < degree; i++) {
    const next = new Array(polynomial.length + 1).fill(0);
    for (let j = 0; j < polynomial.length; j++) {
      next[j] ^= polynomial[j]; next[j + 1] ^= multiply(polynomial[j], root);
    }
    polynomial = next; root = multiply(root, 2);
  }
  const remainder = new Array(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ remainder.shift(); remainder.push(0);
    for (let j = 0; j < degree; j++) remainder[j] ^= multiply(polynomial[j + 1], factor);
  }
  return remainder;
}
function penalty(matrix) {
  const size = matrix.length;
  let score = 0, dark = 0;
  for (let axis = 0; axis < 2; axis++) {
    for (let i = 0; i < size; i++) {
      const line = Array.from({ length: size }, (_, j) => axis ? matrix[j][i] : matrix[i][j]);
      let run = 1;
      for (let j = 1; j < size; j++) {
        if (line[j] === line[j - 1]) run++;
        else { if (run >= 5) score += 3 + run - 5; run = 1; }
      }
      if (run >= 5) score += 3 + run - 5;
      const padded = '0000' + line.map(Number).join('') + '0000';
      for (let j = 0; j <= padded.length - 11; j++) {
        const pattern = padded.slice(j, j + 11);
        if (pattern === '00001011101' || pattern === '10111010000') score += 40;
      }
    }
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    dark += Number(matrix[y][x]);
    if (x + 1 < size && y + 1 < size && matrix[y][x] === matrix[y][x + 1] &&
      matrix[y][x] === matrix[y + 1][x] && matrix[y][x] === matrix[y + 1][x + 1]) score += 3;
  }
  return score + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
}

export function encodeQR(text) {
  const bytes = [...Buffer.from(text, 'utf8')];
  const version = PARAMETERS.findIndex((p, v) => p && 4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= p[0] * 8);
  if (version < 1) throw new Error('QR URL is too long: use a public URL of 271 UTF-8 bytes or less.');
  const [capacity, degree, blockCount] = PARAMETERS[version];
  const bits = [];
  const append = (value, length) => { for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
  append(4, 4); append(bytes.length, version < 10 ? 8 : 16);
  bytes.forEach(byte => append(byte, 8));
  append(0, Math.min(4, capacity * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  let pad = 0xec;
  while (bits.length < capacity * 8) { append(pad, 8); pad ^= 0xfd; }
  const data = Array.from({ length: capacity }, (_, i) => bits.slice(i * 8, i * 8 + 8).reduce((a, b) => a * 2 + b, 0));
  const shortLength = Math.floor(capacity / blockCount), longCount = capacity % blockCount;
  const blocks = [], corrections = [];
  let cursor = 0;
  for (let i = 0; i < blockCount; i++) {
    const length = shortLength + Number(i >= blockCount - longCount);
    const block = data.slice(cursor, cursor + length); cursor += length;
    blocks.push(block); corrections.push(errorCorrection(block, degree));
  }
  const words = [];
  for (let i = 0; i <= shortLength; i++) for (const block of blocks) if (i < block.length) words.push(block[i]);
  for (let i = 0; i < degree; i++) for (const block of corrections) words.push(block[i]);

  const size = version * 4 + 17;
  const matrix = Array.from({ length: size }, () => new Array(size).fill(false));
  const reserved = matrix.map(row => row.slice());
  const set = (x, y, dark) => { matrix[y][x] = Boolean(dark); reserved[y][x] = true; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy, distance = Math.max(Math.abs(dx), Math.abs(dy));
      if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, distance !== 2 && distance !== 4);
    }
  }
  const positions = ALIGNMENTS[version];
  for (const x of positions) for (const y of positions) {
    if ((x === 6 && y === 6) || (x === 6 && y === size - 7) || (x === size - 7 && y === 6)) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }
  const format = mask => {
    const value = 8 | mask; // L correction format bits = 01.
    let remainder = value;
    for (let i = 0; i < 10; i++) remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
    const packed = ((value << 10) | remainder) ^ 0x5412;
    const bit = i => (packed >>> i) & 1;
    for (let i = 0; i < 6; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  format(0);
  if (version >= 7) {
    let remainder = version;
    for (let i = 0; i < 12; i++) remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
    const packed = (version << 12) | remainder;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + i % 3, b = Math.floor(i / 3), bit = (packed >>> i) & 1;
      set(a, b, bit); set(b, a, bit);
    }
  }
  let bitIndex = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    const upward = ((right + 1) & 2) === 0;
    for (let step = 0; step < size; step++) for (let column = 0; column < 2; column++) {
      const x = right - column, y = upward ? size - 1 - step : step;
      if (!reserved[y][x] && bitIndex < words.length * 8) {
        matrix[y][x] = Boolean((words[bitIndex >>> 3] >>> (7 - bitIndex % 8)) & 1); bitIndex++;
      }
    }
  }
  if (bitIndex !== words.length * 8) throw new Error('QR placement failed.');
  const apply = mask => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!reserved[y][x] && masks[mask](x, y)) matrix[y][x] = !matrix[y][x];
  };
  let bestMask = 0, bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    apply(mask); format(mask);
    const score = penalty(matrix);
    if (score < bestPenalty) { bestPenalty = score; bestMask = mask; }
    apply(mask);
  }
  apply(bestMask); format(bestMask);
  return matrix;
}

export function svgForQR(matrix) {
  const size = matrix.length + 8;
  const segments = [];
  matrix.forEach((row, y) => row.forEach((dark, x) => { if (dark) segments.push(`M${x + 4},${y + 4}h1v1h-1z`); }));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 12}" height="${size * 12}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${segments.join('')}" fill="#000"/></svg>\n`;
}
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}
export function pngForQR(matrix, scale = 16) {
  const size = (matrix.length + 8) * scale;
  const pixels = Buffer.alloc((size + 1) * size, 255);
  for (let y = 0; y < size; y++) {
    pixels[y * (size + 1)] = 0; // PNG row filter: none.
    for (let x = 0; x < size; x++) {
      const mx = Math.floor(x / scale) - 4, my = Math.floor(y / scale) - 4;
      if (my >= 0 && my < matrix.length && mx >= 0 && mx < matrix.length && matrix[my][mx]) pixels[y * (size + 1) + x + 1] = 0;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; // 8-bit grayscale.
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}
