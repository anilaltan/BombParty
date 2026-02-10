/**
 * Fetch Turkish words from Kelimetre.com and merge into dictionary.json.
 * Source: https://www.kelimetre.com/kelime-listeleri
 * Run from repo root: node backend/scripts/fetch-kelimetre.js
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { filterAndSanitize, normalizeTurkishLower } from '../src/dictionary/filter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://www.kelimetre.com';
const MAIN_URL = `${BASE}/kelime-listeleri`;
const LETTER_PATHS = ['a', 'b', 'c', 'ç', 'd', 'e', 'f', 'g', 'h', 'ı', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'ö', 'p', 'r', 's', 'ş', 't', 'u', 'ü', 'v', 'y', 'z'];

// Letter pages use <a><STRONG>A</STRONG>WORD</a>; main page uses <a>WORD</a>. Capture inner HTML then strip tags.
const LI_WORD_RE = /<li\s+class="nokta"><a\s+[^>]*>([\s\S]*?)<\/a><\/li>/gi;

function extractWords(html) {
  const words = [];
  let m;
  LI_WORD_RE.lastIndex = 0;
  while ((m = LI_WORD_RE.exec(html)) !== null) {
    const inner = m[1].replace(/<[^>]+>/g, '').trim();
    if (inner && !inner.includes('Devamı')) words.push(inner);
  }
  return words;
}

async function fetchUrl(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'WordBomb/1.0' } });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.text();
}

async function main() {
  const rawWords = new Set();

  console.log('Fetching main page...');
  const mainHtml = await fetchUrl(MAIN_URL);
  for (const w of extractWords(mainHtml)) rawWords.add(w);
  console.log(`Main page: ${rawWords.size} words so far`);

  for (const letter of LETTER_PATHS) {
    const slug = `${letter}-ile-baslayan-kelimeler`;
    const url = `${BASE}/${encodeURIComponent(slug)}`;
    try {
      const html = await fetchUrl(url);
      const countBefore = rawWords.size;
      for (const w of extractWords(html)) rawWords.add(w);
      console.log(`${letter}: +${rawWords.size - countBefore} (total ${rawWords.size})`);
    } catch (e) {
      console.warn(`${letter}: ${e.message}`);
    }
  }

  const normalized = [...rawWords].map((w) => normalizeTurkishLower(w)).filter(Boolean);
  const filtered = filterAndSanitize(normalized);

  const dataPath = join(__dirname, '../data/dictionary.json');
  let existing = [];
  try {
    const raw = await readFile(dataPath, 'utf8');
    existing = JSON.parse(raw);
    if (!Array.isArray(existing)) existing = [];
  } catch {
    // no existing file
  }

  const merged = [...new Set([...existing, ...filtered])].sort((a, b) => a.localeCompare(b, 'tr'));
  const added = merged.length - existing.length;
  await writeFile(dataPath, JSON.stringify(merged), 'utf8');
  console.log(`Wrote ${merged.length} words to ${dataPath} (${filtered.length} from Kelimetre, ${existing.length} existing, +${added} new)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
