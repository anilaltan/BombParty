import { readFile } from 'fs/promises';

const UTF8 = 'utf8';

/**
 * Load raw content from a local file path.
 * @param {string} filePath - Absolute or relative path to JSON/text file
 * @returns {Promise<string>}
 */
export async function loadFromFile(filePath) {
  return readFile(filePath, UTF8);
}

/**
 * Load raw content from a URL (e.g. TDK JSON).
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function loadFromUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Dictionary fetch failed: ${res.status} ${res.statusText}`);
  return res.text();
}

/**
 * Parse JSON dictionary into a string array of words.
 * Supports: string[], { word: string }[], { kelime: string }[], or object with word keys.
 * @param {string} raw - Raw JSON string
 * @returns {string[]} Non-empty word entries (trimmed, may contain duplicates)
 */
export function parseDictionaryJson(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Dictionary parse error: ${e.message}`);
  }

  if (Array.isArray(data)) {
    return data
      .map((item) => (typeof item === 'string' ? item : item?.word ?? item?.kelime ?? ''))
      .filter((s) => typeof s === 'string' && s.trim().length > 0)
      .map((s) => s.trim());
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return Object.keys(data).filter((k) => k.trim().length > 0);
  }

  throw new Error('Dictionary format not supported: expected array or object');
}

/**
 * Load and parse dictionary from file path.
 * @param {string} filePath
 * @returns {Promise<string[]>}
 */
export async function loadAndParseFromFile(filePath) {
  const raw = await loadFromFile(filePath);
  return parseDictionaryJson(raw);
}

/**
 * Load and parse dictionary from URL.
 * @param {string} url
 * @returns {Promise<string[]>}
 */
export async function loadAndParseFromUrl(url) {
  const raw = await loadFromUrl(url);
  return parseDictionaryJson(raw);
}
