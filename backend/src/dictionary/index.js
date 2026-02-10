/**
 * Dictionary service: RAM-loaded word set for O(1) lookup.
 * Load optimized JSON at startup; expose has(word).
 */
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadAndParseFromFile } from './loader.js';
import { filterAndSanitize } from './filter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {Set<string>|null} */
let wordSet = null;

const DEFAULT_PATH = join(__dirname, '../../data/dictionary.json');

/**
 * Load dictionary from pre-built JSON (array of strings).
 * Call once at server startup.
 * @param {string} [filePath] - Path to dictionary.json; defaults to backend/data/dictionary.json
 * @returns {Promise<number>} Count of loaded words
 */
export async function loadDictionary(filePath = DEFAULT_PATH) {
  const raw = await readFile(filePath, 'utf8');
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) throw new Error('Dictionary JSON must be an array of strings');
  wordSet = new Set(arr);
  return wordSet.size;
}

/**
 * Check if word is in the loaded dictionary (Turkish lowercase).
 * @param {string} word
 * @returns {boolean}
 */
export function has(word) {
  if (!wordSet) throw new Error('Dictionary not loaded; call loadDictionary() first');
  return wordSet.has(typeof word === 'string' ? word.trim().toLocaleLowerCase('tr-TR') : '');
}

/**
 * Get word count (after load).
 * @returns {number}
 */
export function size() {
  return wordSet ? wordSet.size : 0;
}

/**
 * Get all loaded words as an array (for syllable analysis). Call after loadDictionary().
 * @returns {string[]}
 */
export function getWordList() {
  if (!wordSet) throw new Error('Dictionary not loaded; call loadDictionary() first');
  return Array.from(wordSet);
}

/**
 * Build optimized dictionary JSON from a raw TDK source file.
 * Pipe: load & parse -> filter -> write JSON.
 * @param {string} sourcePath - Path to raw TDK JSON
 * @param {string} [outPath] - Output path; defaults to data/dictionary.json
 * @returns {Promise<{ count: number, path: string }>}
 */
export async function buildFromSource(sourcePath, outPath = DEFAULT_PATH) {
  const words = await loadAndParseFromFile(sourcePath);
  const filtered = filterAndSanitize(words);
  const { writeFile } = await import('fs/promises');
  await writeFile(outPath, JSON.stringify(filtered, null, 0), 'utf8');
  return { count: filtered.length, path: outPath };
}

export { loadAndParseFromFile, loadAndParseFromUrl } from './loader.js';
export { filterAndSanitize, normalizeTurkishLower, isTurkishAlpha } from './filter.js';
export {
  initSyllablePool,
  getRandomSyllable,
  getSyllablePoolSize,
  buildSyllableFrequencyMap,
  getValidSyllables,
  extractSyllablesFromWord,
} from './syllables.js';
