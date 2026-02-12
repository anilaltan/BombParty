import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSettings } from '../context/SettingsContext';
import { EVENTS } from '../lib/socket';
import { getAvatarEmoji } from '../lib/avatars';
import type { Player } from '../types/game';

const DEFAULT_TURN_DURATION_MS = 15000;

const BOMB_RADIUS = 68;
const PLAYER_CARD_W = 112;
const PLAYER_CARD_H = 132;

const MAX_ARENA = 620;

function getArenaLayout(playerCount: number) {
  const n = Math.max(playerCount, 1);
  const minRadius = 180;
  const radiusPerPlayer = 42;
  let playerRadius = minRadius + radiusPerPlayer * n;
  let arenaSize = Math.ceil(2 * playerRadius + PLAYER_CARD_H * 1.15);
  if (arenaSize > MAX_ARENA) {
    arenaSize = MAX_ARENA;
    playerRadius = (arenaSize - PLAYER_CARD_H * 1.15) / 2;
  }
  return { arenaSize, playerRadius };
}

function getCirclePosition(
  index: number,
  total: number,
  radius: number,
  center: number
) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
    angleDeg: (angle * 180) / Math.PI,
  };
}

export function Game() {
  const {
    socket,
    connected,
    roomId,
    players,
    gameState,
    liveAttempt,
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
  const [turnNoticeVisible, setTurnNoticeVisible] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [timerSecs, setTimerSecs] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endAtRef = useRef<number | null>(null);
  const lastTickAtRef = useRef<number>(0);
  const turnNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevIsMyTurnRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gameHeadRef = useRef<HTMLDivElement>(null);

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

  const speakMyTurn = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Sira sende');
      utterance.lang = 'tr-TR';
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  const scrollGameAreaIntoView = useCallback(() => {
    gameHeadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const isMyTurn =
    gameState?.status === 'playing' &&
    gameState.currentPlayerId === socket?.id;

  useEffect(() => {
    if (gameState?.status !== 'playing' || !isMyTurn) return;
    socket?.emit(EVENTS.WORD_ATTEMPT, { word });
  }, [gameState?.status, isMyTurn, socket, word]);

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
    const turnDurationMs = gameState.turnDurationMs ?? DEFAULT_TURN_DURATION_MS;
    const endAt = Date.now() + turnDurationMs;
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

  useEffect(() => {
    if (gameState?.status !== 'playing') {
      prevIsMyTurnRef.current = false;
      setTurnNoticeVisible(false);
      if (turnNoticeTimeoutRef.current) {
        clearTimeout(turnNoticeTimeoutRef.current);
        turnNoticeTimeoutRef.current = null;
      }
      return;
    }
    const justBecameMyTurn = isMyTurn && !prevIsMyTurnRef.current;
    if (justBecameMyTurn) {
      setTurnNoticeVisible(true);
      if (soundEnabled) playDing();
      speakMyTurn();
      if (turnNoticeTimeoutRef.current) clearTimeout(turnNoticeTimeoutRef.current);
      turnNoticeTimeoutRef.current = setTimeout(() => {
        setTurnNoticeVisible(false);
      }, 2500);
    }
    if (!isMyTurn) {
      setTurnNoticeVisible(false);
      if (turnNoticeTimeoutRef.current) {
        clearTimeout(turnNoticeTimeoutRef.current);
        turnNoticeTimeoutRef.current = null;
      }
    }
    prevIsMyTurnRef.current = isMyTurn;
    return () => {
      if (turnNoticeTimeoutRef.current) {
        clearTimeout(turnNoticeTimeoutRef.current);
        turnNoticeTimeoutRef.current = null;
      }
    };
  }, [gameState?.status, isMyTurn, playDing, soundEnabled, speakMyTurn]);

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

  const n = Math.max(players.length, 1);
  const { arenaSize, playerRadius } = getArenaLayout(n);
  const center = arenaSize / 2;
  const currentPlayerIndex = gameState.currentPlayerId
    ? players.findIndex((p) => p.socketId === gameState.currentPlayerId)
    : -1;
  const arrowAngle = currentPlayerIndex >= 0 ? (2 * Math.PI * currentPlayerIndex) / n - Math.PI / 2 : 0;
  const timerUrgent = timerSecs !== null && timerSecs <= 5;

  return (
    <div className={`game-screen bg-[#252220] text-white flex flex-col min-h-0 ${gameContentClass}`}>
      <header className="flex items-center justify-between px-4 py-3.5 shrink-0 border-b border-white/[0.08] bg-black/20">
        <span className="text-gray-400 text-base font-medium">Türkçe (min. 1 kelime)</span>
        <button
          type="button"
          onClick={() => setShowRules((r) => !r)}
          className="px-5 py-2.5 rounded-lg bg-white/[0.12] hover:bg-white/[0.18] text-gray-100 text-base font-medium border border-white/[0.08] transition-colors"
        >
          Kurallar
        </button>
      </header>

      {showRules && (
        <div className="px-4 py-3.5 border-b border-white/[0.08] bg-black/20 text-base text-gray-400 leading-relaxed">
          Heceyi içeren geçerli bir kelime yaz. Süre dolmadan gönder; yoksa elenirsin. Canlar bitene kadar hayatta kal.
        </div>
      )}

      <div ref={gameHeadRef} className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 overflow-auto">
        <div
          className="relative shrink-0 max-w-[min(100vw-2rem,640px)] max-h-[min(90dvh,640px)] game-arena"
          style={{ width: arenaSize, height: arenaSize }}
        >
          {/* Oyuncular dairede — konumlar üst üste binmeyecek şekilde */}
          {players.map((p: Player, i: number) => {
            const pos = getCirclePosition(i, n, playerRadius, center);
            const isCurrent = p.socketId === gameState.currentPlayerId;
            const currentWord =
              isCurrent && (liveAttempt?.word ?? gameState.currentSyllable)
                ? (liveAttempt?.word ?? gameState.currentSyllable ?? '').toUpperCase()
                : '';
            return (
              <div
                key={p.socketId}
                className={`absolute flex flex-col items-center justify-center transition-all duration-300 rounded-2xl p-3 game-player-card ${isCurrent ? 'current animate-player-turn' : ''}`}
                style={{
                  width: PLAYER_CARD_W,
                  height: PLAYER_CARD_H,
                  left: pos.x - PLAYER_CARD_W / 2,
                  top: pos.y - PLAYER_CARD_H / 2,
                }}
              >
                <span className="text-base mb-1.5 leading-none select-none">
                  {p.isEliminated ? '💀' : '❤️'.repeat(Math.min(p.lives, 3))}
                </span>
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2 transition-colors shrink-0 ${
                    isCurrent ? 'border-amber-400 bg-amber-500/15' : 'border-gray-600 bg-gray-700'
                  } ${p.isEliminated ? 'opacity-50 grayscale' : ''}`}
                >
                  {getAvatarEmoji(p.avatarId)}
                </div>
                <span
                  className={`text-sm mt-2 text-center truncate max-w-full px-1 leading-snug font-semibold antialiased ${
                    p.isEliminated ? 'text-gray-500' : 'text-gray-100'
                  }`}
                  title={p.nickname ?? p.socketId}
                >
                  {p.nickname?.trim() ?? p.socketId.slice(0, 10) ?? '—'}
                </span>
                <span
                  className={`text-xs font-mono text-center truncate max-w-full leading-snug mt-0.5 antialiased ${
                    isCurrent ? 'text-emerald-400 font-bold' : 'text-gray-400'
                  }`}
                >
                  {currentWord || '—'}
                </span>
              </div>
            );
          })}

          {/* Sıra oku: bombanın ortasından mevcut oyuncu yönüne */}
          {currentPlayerIndex >= 0 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none animate-turn-arrow animate-arrow-pulse drop-shadow-[0_0_6px_rgba(234,179,8,0.4)]"
              viewBox={`0 0 ${arenaSize} ${arenaSize}`}
            >
              <defs>
                <marker
                  id="arrowhead-game"
                  markerWidth="16"
                  markerHeight="12"
                  refX="13"
                  refY="6"
                  orient="auto"
                >
                  <polygon points="0 0, 16 6, 0 12" fill="#eab308" stroke="#b45309" strokeWidth="0.5" />
                </marker>
                <filter id="arrowShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
                </filter>
              </defs>
              <line
                x1={center}
                y1={center}
                x2={center + (playerRadius - 42) * Math.cos(arrowAngle)}
                y2={center + (playerRadius - 42) * Math.sin(arrowAngle)}
                stroke="#eab308"
                strokeWidth="7"
                strokeLinecap="round"
                markerEnd="url(#arrowhead-game)"
                filter="url(#arrowShadow)"
              />
            </svg>
          )}

          {/* Ortada bomba + hece */}
          <div
            className={`absolute left-1/2 top-1/2 flex flex-col items-center justify-center origin-center ${
              timerUrgent ? 'animate-bomb-pulse-urgent' : 'animate-bomb-pulse'
            }`}
            style={{
              width: BOMB_RADIUS * 2,
              height: BOMB_RADIUS * 2,
              marginLeft: -BOMB_RADIUS,
              marginTop: -BOMB_RADIUS,
            }}
          >
            <div className="relative flex items-center justify-center">
              <svg
                width={BOMB_RADIUS * 2}
                height={BOMB_RADIUS * 2}
                viewBox="0 0 104 104"
                className="drop-shadow-lg"
              >
                <defs>
                  <radialGradient id="bombGrad" cx="0.35" cy="0.35" r="0.7">
                    <stop offset="0%" stopColor="#4a4541" />
                    <stop offset="100%" stopColor="#2a2520" />
                  </radialGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <ellipse cx="44" cy="52" rx="38" ry="42" fill="url(#bombGrad)" stroke="#3a3530" strokeWidth="2" />
                <path
                  d="M 82 38 Q 100 30 98 44 Q 96 52 90 48"
                  fill="none"
                  stroke="#5a5550"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="94" cy="42" r="4" fill="#eab308" filter="url(#glow)" />
              </svg>
              <div
                className="absolute inset-0 flex items-center justify-center rounded-full bomb-syllable-disk"
                style={{ width: 76, height: 76, left: '50%', top: '50%', marginLeft: -38, marginTop: -38 }}
              >
                <span className="text-white font-bold text-3xl tracking-widest uppercase drop-shadow-sm">
                  {gameState.currentSyllable?.toLocaleLowerCase('tr-TR') ?? '—'}
                </span>
              </div>
            </div>
            {timerSecs !== null && (
              <p
                key={timerSecs}
                className="text-red-400 font-mono text-lg font-bold mt-2 animate-timer-tick tabular-nums min-w-[2.5rem] text-center"
              >
                {timerSecs}s
              </p>
            )}
          </div>
        </div>

        {turnNoticeVisible && isMyTurn && (
          <p className="mt-4 px-6 py-2.5 rounded-full bg-amber-500/25 border border-amber-400/60 text-amber-200 font-semibold animate-pulse text-base shadow-lg shadow-amber-900/20">
            Sıra sende!
          </p>
        )}

        {lastWordResult && (
          <p
            className={`mt-3 text-lg font-medium animate-feedback-pop ${
              lastWordResult.ok ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {lastWordResult.ok ? 'Doğru!' : lastWordResult.error}
          </p>
        )}

        {isMyTurn && (
          <form onSubmit={handleSubmit} className="flex gap-3 mt-5 shrink-0 w-full max-w-sm">
            <input
              onFocus={scrollGameAreaIntoView}
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Kelime yaz..."
              autoComplete="off"
              className="flex-1 px-4 py-3 rounded-xl bg-gray-800/90 border border-gray-600 text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-shadow disabled:opacity-60"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !word.trim()}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-base font-semibold text-white border border-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-colors"
            >
              Gönder
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
