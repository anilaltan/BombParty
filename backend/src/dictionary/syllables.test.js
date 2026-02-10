import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  extractSyllablesFromWord,
  buildSyllableFrequencyMap,
  getValidSyllables,
  initSyllablePool,
  getRandomSyllable,
  getSyllablePoolSize,
} from './syllables.js';

describe('extractSyllablesFromWord', () => {
  it('returns 2- and 3-letter substrings', () => {
    const syl = extractSyllablesFromWord('elma');
    assert.ok(syl.has('el'));
    assert.ok(syl.has('lm'));
    assert.ok(syl.has('ma'));
    assert.ok(syl.has('elm'));
    assert.ok(syl.has('lma'));
    assert.strictEqual(syl.size, 5);
  });
  it('returns empty for short word', () => {
    assert.strictEqual(extractSyllablesFromWord('a').size, 0);
    assert.strictEqual(extractSyllablesFromWord('ab').size, 1);
    assert.ok(extractSyllablesFromWord('ab').has('ab'));
  });
  it('handles 3-letter word', () => {
    const syl = extractSyllablesFromWord('abc');
    assert.ok(syl.has('ab'));
    assert.ok(syl.has('bc'));
    assert.ok(syl.has('abc'));
    assert.strictEqual(syl.size, 3);
  });
});

describe('buildSyllableFrequencyMap', () => {
  it('counts words containing each syllable', () => {
    const words = ['elma', 'elmas', 'el']; // el in 3, ma in 2, lm in 2 (2–3 letter substrings only)
    const freq = buildSyllableFrequencyMap(words);
    assert.strictEqual(freq.get('el'), 3);
    assert.strictEqual(freq.get('ma'), 2);
    assert.strictEqual(freq.get('lm'), 2);
  });
  it('returns empty map for empty input', () => {
    const freq = buildSyllableFrequencyMap([]);
    assert.strictEqual(freq.size, 0);
  });
});

describe('getValidSyllables', () => {
  it('filters by min word count', () => {
    const freq = new Map([
      ['ab', 60],
      ['cd', 30],
      ['ef', 50],
    ]);
    const out = getValidSyllables(freq, 50);
    assert.strictEqual(out.length, 2);
    assert.ok(out.includes('ab'));
    assert.ok(out.includes('ef'));
    assert.ok(!out.includes('cd'));
  });
  it('returns empty for empty map', () => {
    assert.strictEqual(getValidSyllables(new Map(), 50).length, 0);
  });
});

describe('initSyllablePool and getRandomSyllable', () => {
  it('builds pool and getRandomSyllable returns one of them', () => {
    const words = ['ab', 'ab', 'ab', 'ac', 'ac', 'ad', 'ad', 'ad'];
    for (let i = 0; i < 50; i++) words.push('xy');
    initSyllablePool(words, 2);
    assert.ok(getSyllablePoolSize() >= 1);
    const s = getRandomSyllable();
    assert.strictEqual(typeof s, 'string');
    assert.ok(s.length >= 2 && s.length <= 3);
  });
  it('getRandomSyllable throws when pool empty', () => {
    initSyllablePool([], 50);
    assert.strictEqual(getSyllablePoolSize(), 0);
    assert.throws(() => getRandomSyllable(), /pool not initialized or empty/);
  });
  it('multiple calls return values from pool', () => {
    const words = [];
    for (let i = 0; i < 60; i++) words.push('aa');
    for (let i = 0; i < 60; i++) words.push('bb');
    initSyllablePool(words, 50);
    const seen = new Set();
    for (let i = 0; i < 20; i++) seen.add(getRandomSyllable());
    assert.ok(seen.size >= 1 && seen.size <= 2);
  });
});
