/**
 * Syllable generation engine: valid 2–3 character syllables from dictionary.
 * Syllables are 2 or 3 characters only (MIN_SYLLABLE_LEN, MAX_SYLLABLE_LEN).
 * Pre-compute syllables that appear in at least minWordCount words; random selection from pool.
 */
import { randomInt } from 'crypto';

const MIN_SYLLABLE_LEN = 2;
const MAX_SYLLABLE_LEN = 3;
const DEFAULT_MIN_WORD_COUNT = 50;

/** @type {string[]} */
let syllablePool = [];

/**
 * Extract unique 2- and 3-letter substrings (syllables) from a word.
 * @param {string} word - Normalized lowercase word
 * @returns {Set<string>}
 */
export function extractSyllablesFromWord(word) {
  const out = new Set();
  if (typeof word !== 'string' || word.length < MIN_SYLLABLE_LEN) return out;
  const s = word.trim();
  for (let len = MIN_SYLLABLE_LEN; len <= MAX_SYLLABLE_LEN && len <= s.length; len++) {
    for (let i = 0; i <= s.length - len; i++) {
      out.add(s.slice(i, i + len));
    }
  }
  return out;
}

/**
 * Build syllable -> word count (how many words contain this syllable).
 * @param {string[]} words
 * @returns {Map<string, number>}
 */
export function buildSyllableFrequencyMap(words) {
  const freq = new Map();
  if (!Array.isArray(words)) return freq;
  for (const word of words) {
    const syllables = extractSyllablesFromWord(word);
    for (const syl of syllables) {
      freq.set(syl, (freq.get(syl) ?? 0) + 1);
    }
  }
  return freq;
}

/**
 * Filter syllables by minimum word count and return as array for random access.
 * @param {Map<string, number>} frequencyMap
 * @param {number} minWordCount
 * @returns {string[]}
 */
export function getValidSyllables(frequencyMap, minWordCount = DEFAULT_MIN_WORD_COUNT) {
  if (!frequencyMap || typeof minWordCount !== 'number' || minWordCount < 1) return [];
  const out = [];
  for (const [syllable, count] of frequencyMap) {
    if (count >= minWordCount) out.push(syllable);
  }
  return out;
}

/**
 * Initialize the syllable pool from a word list. Call after dictionary is loaded.
 * @param {string[]} wordList
 * @param {number} [minWordCount]
 */
export function initSyllablePool(wordList, minWordCount = DEFAULT_MIN_WORD_COUNT) {
  const freq = buildSyllableFrequencyMap(wordList);
  syllablePool = getValidSyllables(freq, minWordCount);
  return syllablePool.length;
}

/**
 * Randomly select one syllable from the pre-computed pool.
 * @returns {string}
 * @throws {Error} If pool not initialized or empty
 */
export function getRandomSyllable() {
  if (syllablePool.length === 0) {
    throw new Error('Syllable pool not initialized or empty; call initSyllablePool() with word list first');
  }
  const index = randomInt(0, syllablePool.length);
  return syllablePool[index];
}

/**
 * Get current pool size (for tests / diagnostics).
 * @returns {number}
 */
export function getSyllablePoolSize() {
  return syllablePool.length;
}
