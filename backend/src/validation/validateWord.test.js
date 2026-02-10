import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateWord } from './validateWord.js';

const dictSet = new Set(['kalem', 'kaçık', 'kale', 'şeker', 'çikolata']);
const has = (word) => dictSet.has(word);

describe('validateWord', () => {
  it('returns valid for word containing syllable and in dictionary', () => {
    const r = validateWord('kalem', 'ka', [], { has });
    assert.strictEqual(r.valid, true);
    assert.strictEqual(r.reason, undefined);
  });

  it('returns invalid when word does not contain syllable', () => {
    const r = validateWord('kalem', 'ba', [], { has });
    assert.strictEqual(r.valid, false);
    assert.strictEqual(r.reason, 'Word must contain the syllable');
  });

  it('returns invalid when word not in dictionary', () => {
    const r = validateWord('xyznonexistent', 'xy', [], { has });
    assert.strictEqual(r.valid, false);
    assert.strictEqual(r.reason, 'Word not in dictionary');
  });

  it('returns invalid when word already used this round', () => {
    const r = validateWord('kalem', 'ka', ['kalem'], { has });
    assert.strictEqual(r.valid, false);
    assert.strictEqual(r.reason, 'Word already used this round');
  });

  it('returns invalid for empty word', () => {
    const r = validateWord('', 'ka', [], { has });
    assert.strictEqual(r.valid, false);
    assert.strictEqual(r.reason, 'Word required');
  });

  it('normalizes Turkish and checks syllable', () => {
    const r = validateWord('  KALEM  ', 'ka', [], { has });
    assert.strictEqual(r.valid, true);
  });

  it('returns Validation unavailable when has is not provided', () => {
    const r = validateWord('kalem', 'ka', [], {});
    assert.strictEqual(r.valid, false);
    assert.strictEqual(r.reason, 'Validation unavailable');
  });

  it('returns Validation unavailable when has throws', () => {
    const r = validateWord('kalem', 'ka', [], {
      has: () => {
        throw new Error('Dict error');
      },
    });
    assert.strictEqual(r.valid, false);
    assert.strictEqual(r.reason, 'Validation unavailable');
  });
});
