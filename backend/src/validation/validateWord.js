/**
 * Real-time word validation for the game round.
 * Checks: word contains syllable, word in dictionary, word not already used.
 * @module validation/validateWord
 */

import { normalizeTurkishLower } from '../dictionary/filter.js';

/**
 * @typedef {Object} ValidateWordOptions
 * @property {(word: string) => boolean} has - Dictionary lookup (e.g. dictionary.has)
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string} [reason] - Present when valid is false
 */

/**
 * Validates a player-submitted word for the current round.
 * Order: empty -> syllable containment -> dictionary -> already used.
 *
 * @param {string} word - Raw input word
 * @param {string} syllable - Current round syllable
 * @param {string[]} usedWords - Words already used this round
 * @param {ValidateWordOptions} options - Must include has() for dictionary lookup
 * @returns {ValidationResult}
 */
export function validateWord(word, syllable, usedWords = [], options = {}) {
  const normalizedWord = normalizeTurkishLower(word);
  const normalizedSyllable = (typeof syllable === 'string' ? syllable : '').trim().toLocaleLowerCase('tr-TR').normalize('NFC');

  if (!normalizedWord) {
    return { valid: false, reason: 'Word required' };
  }

  if (!normalizedSyllable || !normalizedWord.includes(normalizedSyllable)) {
    return { valid: false, reason: 'Word must contain the syllable' };
  }

  const { has } = options;
  if (typeof has !== 'function') {
    return { valid: false, reason: 'Validation unavailable' };
  }

  try {
    if (!has(normalizedWord)) {
      return { valid: false, reason: 'Word not in dictionary' };
    }
  } catch {
    return { valid: false, reason: 'Validation unavailable' };
  }

  const used = Array.isArray(usedWords) ? usedWords : [];
  if (used.includes(normalizedWord)) {
    return { valid: false, reason: 'Word already used this round' };
  }

  return { valid: true };
}
