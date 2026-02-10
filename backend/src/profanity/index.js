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
} catch {
  blacklist = [];
}

/**
 * Returns true if the text contains any blacklisted term (substring match).
 * @param {string} text - Raw input (username or message)
 * @returns {boolean}
 */
export function isProfane(text) {
  if (typeof text !== 'string' || !text.trim()) return false;
  const normalized = normalizeTurkishLower(text);
  return blacklist.some((term) => term && normalized.includes(term));
}
