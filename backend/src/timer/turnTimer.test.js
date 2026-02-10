/**
 * Unit tests for turn timer: start, reset, cancel, onExpire, getRemainingMs, getExpiredAt.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createTurnTimer } from './turnTimer.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

describe('createTurnTimer', () => {
  it('calls onExpire after durationMs + graceMs', async () => {
    let expired = false;
    const timer = createTurnTimer({ durationMs: 25, graceMs: 20, onExpire: () => { expired = true; } });
    timer.start();
    assert.strictEqual(expired, false);
    await delay(30);
    assert.strictEqual(expired, false);
    await delay(20);
    assert.strictEqual(expired, true);
  });

  it('cancelGrace prevents onExpire', async () => {
    let count = 0;
    const timer = createTurnTimer({ durationMs: 25, graceMs: 50, onExpire: () => { count++; } });
    timer.start();
    await delay(30);
    assert.ok(timer.getExpiredAt() != null, 'expiredAt set after main timer fires');
    timer.cancelGrace();
    await delay(60);
    assert.strictEqual(count, 0);
  });

  it('reset cancels and restarts', async () => {
    let count = 0;
    const timer = createTurnTimer({ durationMs: 25, graceMs: 10, onExpire: () => { count++; } });
    timer.start();
    await delay(15);
    timer.reset();
    await delay(20);
    assert.strictEqual(count, 0);
    await delay(20);
    assert.strictEqual(count, 1);
  });

  it('cancel clears and does not fire', async () => {
    let count = 0;
    const timer = createTurnTimer({ durationMs: 30, graceMs: 10, onExpire: () => { count++; } });
    timer.start();
    await delay(10);
    timer.cancel();
    await delay(50);
    assert.strictEqual(count, 0);
  });

  it('getRemainingMs returns 0 when no active timer', () => {
    const timer = createTurnTimer({ durationMs: 100, onExpire: () => {} });
    assert.strictEqual(timer.getRemainingMs(), 0);
  });

  it('getRemainingMs returns positive value after start', () => {
    const timer = createTurnTimer({ durationMs: 1000, onExpire: () => {} });
    timer.start();
    const rem = timer.getRemainingMs();
    assert.ok(rem > 0 && rem <= 1000);
  });

  it('getExpiredAt returns null until main expiry then timestamp', async () => {
    const timer = createTurnTimer({ durationMs: 40, graceMs: 30, onExpire: () => {} });
    assert.strictEqual(timer.getExpiredAt(), null);
    timer.start();
    await delay(25);
    assert.strictEqual(timer.getExpiredAt(), null);
    await delay(25);
    assert.ok(typeof timer.getExpiredAt() === 'number');
  });
});
