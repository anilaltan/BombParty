import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSettings } from '../context/SettingsContext';
import { EVENTS } from '../lib/socket';
import { getAvatarEmoji } from '../lib/avatars';
import type { Player } from '../types/game';

const TURN_DURATION_MS = 15000;

export function Game() {
  const {
    socket,
    connected,
    roomId,
    players,
    gameState,
    lastWordResult,
    gameEnd,
    clearLastWordResult,
    clearGameEnd,
  } = useSocket();
  const { soundEnabled } = useSettings();
  const [word, setWord] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [invalidFlash, setInvalidFlash] = useState(false);
  const [validFlash, setValidFlash] = useState(false);
  const [timerSecs, setTimerSecs] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endAtRef = useRef<number | null>(null);
  const lastTickAtRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (audioContextRef.current) return audioContextRef.current;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (Ctx) audioContextRef.current = new Ctx();
    return audioContextRef.current;
  }, []);

  const playDing = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // ignore
    }
  }, [getAudioContext]);

  const playTick = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 1200;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // ignore
    }
  }, [getAudioContext]);

  const isMyTurn =
    gameState?.status === 'playing' &&
    gameState.currentPlayerId === socket?.id;

  // Client-side countdown: start when gameState changes (new turn); bomb tick sound speeds up as time runs out
  useEffect(() => {
    if (gameState?.status !== 'playing' || !gameState.currentPlayerId) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimerSecs(null);
      endAtRef.current = null;
      return;
    }
    const endAt = Date.now() + TURN_DURATION_MS;
    endAtRef.current = endAt;
    lastTickAtRef.current = Date.now();
    const isMyTurnForTick = gameState.currentPlayerId === socket?.id;
    const tick = () => {
      const now = Date.now();
      const left = Math.ceil((endAtRef.current! - now) / 1000);
      if (left <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setTimerSecs(0);
        return;
      }
      setTimerSecs(left);
      const intervalMs = left > 10 ? 1000 : left > 5 ? 500 : 250;
      if (isMyTurnForTick && soundEnabled && now - lastTickAtRef.current >= intervalMs) {
        lastTickAtRef.current = now;
        playTick();
      }
    };
    tick();
    timerRef.current = setInterval(tick, 200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    gameState?.status,
    gameState?.currentPlayerId,
    gameState?.currentSyllable,
    socket?.id,
    playTick,
    soundEnabled,
  ]);

  useEffect(() => {
    if (!lastWordResult) return;
    if (!lastWordResult.ok) {
      setInvalidFlash(true);
      const t = setTimeout(() => setInvalidFlash(false), 600);
      return () => clearTimeout(t);
    }
    setValidFlash(true);
    if (soundEnabled) playDing();
    const t = setTimeout(() => setValidFlash(false), 500);
    return () => clearTimeout(t);
  }, [lastWordResult, playDing, soundEnabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = word.trim();
    if (!w || submitting || !isMyTurn) return;
    setSubmitting(true);
    clearLastWordResult();
    socket?.emit(
      EVENTS.SUBMIT_WORD,
      { word: w },
      (res: { ok?: boolean; error?: string }) => {
        setSubmitting(false);
        if (res?.ok) setWord('');
      }
    );
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-amber-400">Connecting...</p>
      </div>
    );
  }

  if (gameEnd) {
    const winnerPlayer = gameEnd.players.find((p) => p.socketId === gameEnd.winner);
    const winnerName =
      winnerPlayer?.nickname?.trim() ||
      (winnerPlayer?.socketId && winnerPlayer.socketId.slice(0, 8)) ||
      (gameEnd.winner && String(gameEnd.winner).slice(0, 8)) ||
      'Winner';
    const sorted = [...gameEnd.players].sort((a, b) => b.score - a.score);
    const isWinner = gameEnd.winner === socket?.id;
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 gap-8">
        <div className="flex flex-col items-center gap-2">
          <span className="text-6xl" aria-hidden>{gameEnd.winner ? '🏆' : '🤝'}</span>
          <h1 className="text-3xl font-bold text-center">
            {gameEnd.winner ? (isWinner ? 'You Win!' : 'Game Over') : 'Draw'}
          </h1>
          {gameEnd.winner && (
            <p className={`text-xl ${isWinner ? 'text-amber-400' : 'text-gray-300'}`}>
              {winnerName} wins!
            </p>
          )}
        </div>
        <div className="w-full max-w-xs rounded-xl bg-gray-800/80 border border-gray-700 overflow-hidden">
          <div className="px-4 py-2 bg-gray-700/50 text-gray-400 text-sm font-medium uppercase tracking-wider">
            Final scores
          </div>
          <ul className="divide-y divide-gray-700">
            {sorted.map((p, i) => (
              <li
                key={p.socketId ?? i}
                className={`flex justify-between items-center gap-4 px-4 py-3 ${
                  p.socketId === gameEnd.winner ? 'bg-amber-500/10 text-amber-400' : ''
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-gray-500 w-5 text-sm">#{i + 1}</span>
                  <span className="text-lg">{getAvatarEmoji(p.avatarId)}</span>
                  <span className="font-medium">{p.nickname?.trim() || p.socketId?.slice(0, 8) || '—'}</span>
                </span>
                <span className="font-mono tabular-nums">{p.score}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={clearGameEnd}
          className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium transition"
        >
          Back to lobby
        </button>
      </div>
    );
  }

  if (gameState?.status !== 'playing' || !roomId) {
    return null;
  }

  const gameContentClass = [
    'game-content',
    invalidFlash && 'shake-on-invalid flash-red-on-invalid',
    validFlash && 'flash-green-on-valid',
  ]
    .filter(Boolean)
    .join(' ');

  const gameHeadRef = useRef<HTMLDivElement>(null);
  const scrollGameAreaIntoView = useCallback(() => {
    gameHeadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="game-screen bg-gray-900 text-white flex flex-col items-center p-4 gap-6 overflow-y-auto">
      <div className={`flex flex-col items-center gap-6 flex-1 min-h-0 ${gameContentClass}`}>
        <div ref={gameHeadRef} className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold">Word Bomb</h1>
          <p className="text-5xl font-mono tracking-widest text-amber-400 lowercase">
            {gameState.currentSyllable?.toLocaleLowerCase('tr-TR') ?? '—'}
          </p>
          {timerSecs !== null && (
            <p className="text-2xl font-mono text-red-400">
              {timerSecs}s
            </p>
          )}
        </div>
        {(gameState.usedWords?.length ?? 0) > 0 && (
          <div className="w-full max-w-md">
            <p className="text-gray-400 text-sm font-medium mb-1">Kullanılan kelimeler</p>
            <p className="text-gray-300 font-mono text-sm break-words">
              {(gameState.usedWords ?? []).join(', ')}
            </p>
          </div>
        )}
        {lastWordResult && (
          <p className={lastWordResult.ok ? 'text-emerald-400' : 'text-red-400'}>
            {lastWordResult.ok ? 'Correct!' : lastWordResult.error}
          </p>
        )}
        {isMyTurn && (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              onFocus={scrollGameAreaIntoView}
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Type a word..."
              autoComplete="off"
              className="px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white w-64"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !word.trim()}
              className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
            >
              Submit
            </button>
          </form>
        )}
        {!isMyTurn && gameState.currentPlayerId && (
          <p className="text-gray-400">
            Waiting for {players.find((p) => p.socketId === gameState.currentPlayerId)?.nickname ?? 'player'}...
          </p>
        )}
        <ul className="list-none w-64 space-y-1 border-t border-gray-700 pt-4">
          {players.map((p: Player) => (
            <li
              key={p.socketId}
              className={`flex justify-between py-1 items-center gap-2 ${p.isEliminated ? 'opacity-50' : ''}`}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{getAvatarEmoji(p.avatarId)}</span>
                {p.nickname ?? p.socketId.slice(0, 6)}
              </span>
              <span className="text-sm">
                Lives: {p.lives} · Score: {p.score}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
