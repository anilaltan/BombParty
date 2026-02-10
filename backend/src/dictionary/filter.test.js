import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizeTurkishLower, isTurkishAlpha, filterAndSanitize } from './filter.js';

describe('normalizeTurkishLower', () => {
  it('lowercases and trims', () => {
    assert.strictEqual(normalizeTurkishLower('  ELMA  '), 'elma');
  });
  it('Turkish İ -> i', () => {
    assert.strictEqual(normalizeTurkishLower('İstanbul'), 'istanbul');
  });
  it('Turkish I -> ı', () => {
    assert.strictEqual(normalizeTurkishLower('ISLAK'), 'ıslak');
  });
});

describe('isTurkishAlpha', () => {
  it('accepts Turkish letters', () => {
    assert.ok(isTurkishAlpha('şeker'));
    assert.ok(isTurkishAlpha('çikolata'));
    assert.ok(isTurkishAlpha('güneş'));
    assert.ok(isTurkishAlpha('ıslak'));
  });
  it('rejects digits and spaces', () => {
    assert.ok(!isTurkishAlpha('word1'));
    assert.ok(!isTurkishAlpha('ab cd'));
  });
});

describe('filterAndSanitize', () => {
  it('dedupes and normalizes', () => {
    const out = filterAndSanitize(['Elma', 'elma', '  ELMA  ']);
    assert.strictEqual(out.length, 1);
    assert.strictEqual(out[0], 'elma');
  });
  it('drops too short/long', () => {
    const out = filterAndSanitize(['a', 'ab', 'abcdefghijklmnopqrstuvwxyzabcdef']);
    assert.strictEqual(out.length, 1);
    assert.strictEqual(out[0], 'ab');
  });
  it('drops abbreviations', () => {
    const out = filterAndSanitize(['vb.', 'elma']);
    assert.strictEqual(out.length, 1);
    assert.strictEqual(out[0], 'elma');
  });
  it('keeps Turkish words', () => {
    const out = filterAndSanitize(['şeker', 'çikolata', 'güneş', 'ıslak']);
    assert.ok(out.includes('şeker'));
    assert.ok(out.includes('çikolata'));
    assert.ok(out.includes('güneş'));
    assert.ok(out.includes('ıslak'));
  });
});
