/** Turkish alphabet (lowercase): a-z + ç, ğ, ı, ö, ş, ü */
const TURKISH_ALPHA_REGEX = /^[a-zçğıöşü]+$/;

const MIN_LEN = 2;
const MAX_LEN = 30;

/**
 * Normalize word to Turkish lowercase (tr-TR: İ→i, I→ı) and Unicode NFC.
 * NFC ensures consistent matching (e.g. "feda" with "eda" syllable) across clients/sources.
 * @param {string} word
 * @returns {string}
 */
export function normalizeTurkishLower(word) {
  if (typeof word !== 'string') return '';
  return word.trim().toLocaleLowerCase('tr-TR').normalize('NFC');
}

/**
 * Check if string contains only Turkish letters (a-z, ç, ğ, ı, ö, ş, ü).
 * @param {string} s - Already normalized lowercase
 * @returns {boolean}
 */
export function isTurkishAlpha(s) {
  return typeof s === 'string' && TURKISH_ALPHA_REGEX.test(s);
}

/**
 * Filter and sanitize raw word list for game use.
 * - Normalize to Turkish lowercase
 * - Length between MIN_LEN and MAX_LEN
 * - Turkish letters only (no digits, no spaces, no abbreviations with '.')
 * - Drop duplicates (order not guaranteed)
 * @param {string[]} rawWords
 * @returns {string[]}
 */
export function filterAndSanitize(rawWords) {
  if (!Array.isArray(rawWords)) return [];

  const seen = new Set();
  const out = [];

  for (const w of rawWords) {
    const normalized = normalizeTurkishLower(w);
    if (normalized.length < MIN_LEN || normalized.length > MAX_LEN) continue;
    if (normalized.includes('.')) continue; // abbreviation
    if (!isTurkishAlpha(normalized)) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }

  return out;
}
