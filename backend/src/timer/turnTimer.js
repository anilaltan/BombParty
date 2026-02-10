/**
 * Server-side turn timer for the bomb. Single timeout per turn; supports reset, cancel, grace-period delay, and cancelGrace.
 * @module timer/turnTimer
 */

const DEFAULT_DURATION_MS = 15000;
const DEFAULT_GRACE_MS = 200;

/**
 * @typedef {Object} TurnTimerController
 * @property {() => void} start
 * @property {() => void} reset
 * @property {() => void} cancel
 * @property {() => void} cancelGrace - Cancel the scheduled onExpire (grace window); bomb will not fire.
 * @property {() => number} getRemainingMs
 * @property {() => number | null} getExpiredAt
 */

/**
 * Creates a turn timer. When the countdown expires, expiredAt is set; onExpire is called after graceMs (so late valid words can cancel it).
 *
 * @param {{ durationMs?: number, graceMs?: number, onExpire: () => void }} options
 * @returns {TurnTimerController}
 */
export function createTurnTimer(options = {}) {
  const durationMs = Number(options.durationMs) > 0
    ? Number(options.durationMs)
    : (Number(process.env.TURN_DURATION_MS) > 0 ? Number(process.env.TURN_DURATION_MS) : DEFAULT_DURATION_MS);
  const graceMs = Number(options.graceMs) >= 0
    ? Number(options.graceMs)
    : (Number(process.env.GRACE_MS) >= 0 ? Number(process.env.GRACE_MS) : DEFAULT_GRACE_MS);
  const onExpire = typeof options.onExpire === 'function' ? options.onExpire : () => {};

  let timeoutId = null;
  let graceTimeoutId = null;
  let startedAt = 0;
  let expiredAt = null;

  function clearMain() {
    if (timeoutId != null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function clearGrace() {
    if (graceTimeoutId != null) {
      clearTimeout(graceTimeoutId);
      graceTimeoutId = null;
    }
  }

  function clear() {
    clearMain();
    clearGrace();
  }

  function start() {
    clear();
    expiredAt = null;
    startedAt = Date.now();
    timeoutId = setTimeout(() => {
      expiredAt = Date.now();
      timeoutId = null;
      graceTimeoutId = setTimeout(() => {
        graceTimeoutId = null;
        onExpire();
      }, graceMs);
    }, durationMs);
  }

  function reset() {
    start();
  }

  function cancel() {
    clear();
    startedAt = 0;
  }

  function cancelGrace() {
    clearGrace();
  }

  function getRemainingMs() {
    if (timeoutId == null) return 0;
    const elapsed = Date.now() - startedAt;
    return Math.max(0, durationMs - elapsed);
  }

  function getExpiredAt() {
    return expiredAt ?? null;
  }

  return { start, reset, cancel, cancelGrace, getRemainingMs, getExpiredAt };
}
