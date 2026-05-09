import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateWord } from './validateWord.js';

const dictSet = new Set(['kalem', 'kaçık', 'kale', 'şeker', 'çikolata', 'feda']);
const has = (word) => dictSet.has(word);

describe('validateWord', () => {
  it('returns valid for word containing syllable and in dictionary', () => {
    const r = validateWord('kalem', 'ka', new Set(), { has });
    assert.strictEqual(r.valid, true);
    assert.strictEqual(r.reason, undefined);
  });

  it('returns invalid when word does not contain syllable', () => {
    const r = validateWord('kalem', 'ba', new Set(), { has });
    assert.strictEqual(r.valid, false);
    assert.strictEqual(r.reason, 'Kelime heceyi içermelidir');
  });

  it('returns invalid when word not in dictionary', () => {
    const r = validateWord('xyznonexistent', 'xy', new Set(), { has });
    assert.strictEqual(r.valid, false);
    assert.strictEqual(r.reason, 'Kelime sözlükte yok');
  });

  it('returns invalid when word already used this round', () => {
    const r = validateWord('kalem', 'ka', new Set(['kalem']), { has });
    assert.strictEqual(r.valid, false);
    assert.strictEqual(r.reason, 'Bu turda kelime zaten kullanıldı');
  });

  it('returns invalid for empty word', () => {
    const r = validateWord('', 'ka', new Set(), { has });
    assert.strictEqual(r.valid, false);
    assert.strictEqual(r.reason, 'Kelime gerekli');
  });

  it('normalizes Turkish and checks syllable', () => {
    const r = validateWord('  KALEM  ', 'ka', new Set(), { has });
    assert.strictEqual(r.valid, true);
  });

  it('accepts word containing syllable (e.g. feda for EDA)', () => {
    const r = validateWord('feda', 'EDA', new Set(), { has });
    assert.strictEqual(r.valid, true);
    assert.strictEqual(r.reason, undefined);
  });

  it('returns Doğrulama kullanılamıyor when has is not provided', () => {
    const r = validateWord('kalem', 'ka', new Set(), {});
    assert.strictEqual(r.valid, false);
    assert.strictEqual(r.reason, 'Doğrulama kullanılamıyor');
  });

  it('returns Doğrulama kullanılamıyor when has throws', () => {
    const r = validateWord('kalem', 'ka', new Set(), {
      has: () => {
        throw new Error('Dict error');
      },
    });
    assert.strictEqual(r.valid, false);
    assert.strictEqual(r.reason, 'Doğrulama kullanılamıyor');
  });
});
