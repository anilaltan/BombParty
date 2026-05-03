/**
 * Profanity filter for usernames and chat.
 * Uses a blacklist; normalizes input (Turkish lowercase) and checks for substring matches.
 * @module profanity
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { normalizeTurkishLower } from '../dictionary/filter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {string[]} */
let blacklist = [];

try {
  const path = join(__dirname, '../../data/profanity-blacklist.json');
  const raw = readFileSync(path, 'utf8');
  const arr = JSON.parse(raw);
  blacklist = Array.isArray(arr)
    ? arr.map((w) => normalizeTurkishLower(String(w))).filter(Boolean)
    : [];
} catch (e) {
  // Non-fatal: profanity filtering is best-effort, but log so operators know
  console.warn('[profanity] Failed to load blacklist, filtering disabled:', e.message);
  blacklist = [];
}

/**
 * Returns true if the text contains any blacklisted term.
 * Uses Unicode word-boundary matching (\p{L}) to avoid false positives
 * like "class" matching a blacklisted "ass".
 * @param {string} text - Raw input (username or message)
 * @returns {boolean}
 */
export function isProfane(text) {
  if (typeof text !== 'string' || !text.trim()) return false;
  const normalized = normalizeTurkishLower(text);
  return blacklist.some((term) => {
    if (!term) return false;
    // Escape regex special chars in the term
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use Unicode letter boundaries so "class" doesn't match "ass"
    try {
      const pattern = new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, 'u');
      return pattern.test(normalized);
    } catch {
      // Fallback to substring match if regex construction fails
      return normalized.includes(term);
    }
  });
}
