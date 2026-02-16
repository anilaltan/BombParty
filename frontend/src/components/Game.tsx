import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSettings } from '../context/SettingsContext';
import { EVENTS } from '../lib/socket';
import { getAvatarEmoji } from '../lib/avatars';
import type { Player, ChatMessage } from '../types/game';

const DEFAULT_TURN_DURATION_MS = 15000;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function formatTime(ms: number): string {
  const totalSecs = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
  const [timerMs, setTimerMs] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [myUsedLetters, setMyUsedLetters] = useState<Set<string>>(new Set());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endAtRef = useRef<number | null>(null);
  const lastTickAtRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const [arenaSize, setArenaSize] = useState({ w: 600, h: 500 });

  useEffect(() => {
    if (!arenaRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setArenaSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    obs.observe(arenaRef.current);
    return () => obs.disconnect();
  }, []);

  const getAudioContext = useCallback(() => {
    if (audioContextRef.current) return audioContextRef.current;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (Ctx) audioContextRef.current = new Ctx();
    return audioContextRef.current;
  }, []);

  const playDing = useCallback(() => {
    if (!soundEnabled) return;
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
    } catch { /* ignore */ }
  }, [getAudioContext, soundEnabled]);

  const playTick = useCallback(() => {
    if (!soundEnabled) return;
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
    } catch { /* ignore */ }
  }, [getAudioContext, soundEnabled]);

  const isMyTurn =
    gameState?.status === 'playing' &&
    gameState.currentPlayerId === socket?.id;

  // Send live word attempts
  useEffect(() => {
    if (gameState?.status !== 'playing' || !isMyTurn) return;
    socket?.emit(EVENTS.WORD_ATTEMPT, { word });
  }, [gameState?.status, isMyTurn, socket, word]);

  // Timer countdown
  useEffect(() => {
    if (gameState?.status !== 'playing' || !gameState.currentPlayerId) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimerMs(null);
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
      const left = Math.max(0, endAtRef.current! - now);
      setTimerMs(left);
      if (left <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }
      const secs = Math.ceil(left / 1000);
      const intervalMs = secs > 10 ? 1000 : secs > 5 ? 500 : 250;
      if (isMyTurnForTick && soundEnabled && now - lastTickAtRef.current >= intervalMs) {
        lastTickAtRef.current = now;
        playTick();
      }
    };
    tick();
    timerRef.current = setInterval(tick, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState?.status, gameState?.currentPlayerId, gameState?.currentSyllable, socket?.id, playTick, soundEnabled]);

  // Flash feedback
  useEffect(() => {
    if (!lastWordResult) return;
    if (!lastWordResult.ok) {
      setInvalidFlash(true);
      const t = setTimeout(() => setInvalidFlash(false), 600);
      return () => clearTimeout(t);
    }
    setValidFlash(true);
    if (soundEnabled) playDing();
    // Track used letters from accepted word
    if (lastWordResult.word) {
      const letters = new Set(lastWordResult.word.toUpperCase().split('').filter(c => /[A-ZÇĞIİÖŞÜ]/.test(c)));
      setMyUsedLetters(prev => {
        const next = new Set(prev);
        letters.forEach(l => next.add(l));
        return next;
      });
    }
    const t = setTimeout(() => setValidFlash(false), 500);
    return () => clearTimeout(t);
  }, [lastWordResult, playDing, soundEnabled]);


  // My turn ding
  const prevIsMyTurnRef = useRef(false);
  useEffect(() => {
    if (gameState?.status !== 'playing') {
      prevIsMyTurnRef.current = false;
      return;
    }
    const justBecameMyTurn = isMyTurn && !prevIsMyTurnRef.current;
    if (justBecameMyTurn && soundEnabled) {
      playDing();
      wordInputRef.current?.focus();
    }
    prevIsMyTurnRef.current = isMyTurn;
  }, [gameState?.status, isMyTurn, playDing, soundEnabled]);


  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const me = players.find(p => p.socketId === socket?.id);
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      sender: me?.nickname ?? socket?.id?.slice(0, 8) ?? 'You',
      text,
      timestamp: Date.now(),
      type: 'chat',
    };
    setChatMessages(prev => [...prev.slice(-100), msg]);
    setChatInput('');
  };

  // Compute player layout positions
  const playerPositions = useMemo(() => {
    const n = Math.max(players.length, 1);
    const cx = arenaSize.w / 2;
    const cy = arenaSize.h / 2;
    const rx = Math.min(arenaSize.w * 0.38, 280);
    const ry = Math.min(arenaSize.h * 0.36, 220);
    return players.map((_, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return {
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle),
        angle,
      };
    });
  }, [players.length, arenaSize]);

  if (!connected) {
    return (
      <div className="jklm-lobby">
        <p style={{ color: 'var(--jklm-gold)' }}>Connecting...</p>
      </div>
    );
  }

  // Game end screen
  if (gameEnd) {
    const winnerPlayer = gameEnd.players.find(p => p.socketId === gameEnd.winner);
    const winnerName = winnerPlayer?.nickname?.trim() || winnerPlayer?.socketId?.slice(0, 8) || 'Winner';
    const sorted = [...gameEnd.players].sort((a, b) => b.score - a.score);
    const isWinner = gameEnd.winner === socket?.id;

    return (
      <div className="jklm-game-end">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>{gameEnd.winner ? '🏆' : '🤝'}</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>
            {gameEnd.winner ? (isWinner ? 'You Win!' : 'Game Over') : 'Draw'}
          </h1>
          {gameEnd.winner && (
            <p style={{ fontSize: 18, color: isWinner ? 'var(--jklm-gold)' : 'var(--jklm-text)' }}>
              {winnerName} wins!
            </p>
          )}
        </div>
        <div style={{
          width: '100%',
          maxWidth: 320,
          background: 'var(--jklm-bg-dark)',
          border: '1px solid var(--jklm-border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '8px 16px',
            background: 'var(--jklm-bg-darker)',
            color: 'var(--jklm-text-muted)',
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            Final Scores
          </div>
          {sorted.map((p, i) => (
            <div
              key={p.socketId ?? i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                borderBottom: '1px solid var(--jklm-border)',
                background: p.socketId === gameEnd.winner ? 'rgba(234,179,8,0.08)' : 'transparent',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--jklm-text-muted)', fontSize: 13, width: 20 }}>#{i + 1}</span>
                <span style={{ fontSize: 20 }}>{getAvatarEmoji(p.avatarId)}</span>
                <span style={{
                  fontWeight: 600,
                  color: p.socketId === gameEnd.winner ? 'var(--jklm-gold)' : 'var(--jklm-text)',
                }}>
                  {p.nickname?.trim() || p.socketId?.slice(0, 8) || '—'}
                </span>
              </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16 }}>
                {p.score}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={clearGameEnd}
          className="jklm-lobby-btn-primary"
          style={{ maxWidth: 240 }}
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  if (gameState?.status !== 'playing' || !roomId) {
    return null;
  }

  const n = players.length;
  const currentPlayerIndex = gameState.currentPlayerId
    ? players.findIndex(p => p.socketId === gameState.currentPlayerId)
    : -1;
  const timerSecs = timerMs !== null ? Math.ceil(timerMs / 1000) : null;
  const timerUrgent = timerSecs !== null && timerSecs <= 5;

  const cx = arenaSize.w / 2;
  const cy = arenaSize.h / 2;

  // Arrow endpoint toward current player
  const arrowTarget = currentPlayerIndex >= 0 ? playerPositions[currentPlayerIndex] : null;
  const arrowLength = arrowTarget
    ? Math.sqrt((arrowTarget.x - cx) ** 2 + (arrowTarget.y - cy) ** 2) - 60
    : 0;
  const arrowAngle = arrowTarget?.angle ?? 0;

  const gameFlashClass = [
    invalidFlash && 'shake-on-invalid flash-red-on-invalid',
    validFlash && 'flash-green-on-valid',
  ].filter(Boolean).join(' ');

  const wordsPlayed = gameState.usedWords?.length ?? 0;

  return (
    <div className={`jklm-layout ${gameFlashClass}`}>
      {/* ===== HEADER BAR ===== */}
      <header className="jklm-header">
        <span className="jklm-logo">BOMBPARTY</span>
        <span className="jklm-player-count">{n}</span>
        <span className="jklm-room-name">Room {roomId}</span>
        <span style={{ color: 'var(--jklm-text-muted)', fontSize: 12 }}>•</span>
        <span className="jklm-timer-badge">
          {timerMs !== null ? formatTime(timerMs) : '00:00'}
          <span style={{ marginLeft: 6, opacity: 0.6 }}>({wordsPlayed} words)</span>
        </span>
        <div style={{ flex: 1 }} />
        <span className={`jklm-timer-display ${timerUrgent ? 'urgent' : ''}`}>
          {timerSecs !== null ? `${timerSecs}s` : ''}
        </span>
      </header>

      {/* ===== GAME AREA ===== */}
      <div className="jklm-game-area" ref={arenaRef}>
        {/* Language bar */}
        <div className="jklm-language-bar">
          Türkçe (min. 1 kelime)
        </div>

        <div className="jklm-arena">
          {/* Players around the arena */}
          {players.map((p: Player, i: number) => {
            const pos = playerPositions[i];
            if (!pos) return null;
            const isCurrent = p.socketId === gameState.currentPlayerId;
            const currentWord = isCurrent ? (liveAttempt?.word ?? '').toUpperCase() : '';

            return (
              <div
                key={p.socketId}
                className="jklm-player"
                style={{
                  left: pos.x - 50,
                  top: pos.y - 45,
                  width: 100,
                }}
              >
                <span className="jklm-player-name">
                  {p.nickname?.trim() ?? p.socketId.slice(0, 10)}
                </span>
                <div className={`jklm-player-avatar ${isCurrent ? 'current' : ''} ${p.isEliminated ? 'eliminated' : ''}`}>
                  {getAvatarEmoji(p.avatarId)}
                </div>
                <div className="jklm-player-hearts">
                  {Array.from({ length: 3 }).map((_, li) => (
                    <span key={li} className={`jklm-heart ${li >= p.lives ? 'lost' : ''}`}>
                      ♥
                    </span>
                  ))}
                </div>
                {isCurrent && currentWord && (
                  <span className="jklm-player-word">{currentWord}</span>
                )}
              </div>
            );
          })}

          {/* Turn arrow from center to current player */}
          {arrowTarget && currentPlayerIndex >= 0 && (
            <>
              <svg
                className="jklm-turn-arrow animate-arrow-pulse"
                viewBox={`0 0 ${arenaSize.w} ${arenaSize.h}`}
                preserveAspectRatio="none"
                style={{ width: arenaSize.w, height: arenaSize.h }}
              >
                <defs>
                  <marker
                    id="arrowhead-jklm"
                    markerWidth="14"
                    markerHeight="10"
                    refX="11"
                    refY="5"
                    orient="auto"
                  >
                    <polygon points="0 0, 14 5, 0 10" fill="#eab308" stroke="#b45309" strokeWidth="0.5" />
                  </marker>
                  <filter id="arrowGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#eab308" floodOpacity="0.4" />
                  </filter>
                </defs>
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx + arrowLength * Math.cos(arrowAngle)}
                  y2={cy + arrowLength * Math.sin(arrowAngle)}
                  stroke="#eab308"
                  strokeWidth="6"
                  strokeLinecap="round"
                  markerEnd="url(#arrowhead-jklm)"
                  filter="url(#arrowGlow)"
                />
              </svg>
              {/* Star near the arrow tip */}
              <div
                className="jklm-star"
                style={{
                  left: cx + (arrowLength * 0.55) * Math.cos(arrowAngle) - 9,
                  top: cy + (arrowLength * 0.55) * Math.sin(arrowAngle) - 18,
                }}
              >
                ⭐
              </div>
            </>
          )}

          {/* Center bomb / syllable */}
          <div
            className={`jklm-bomb-center ${timerUrgent ? 'animate-bomb-pulse-urgent' : 'animate-bomb-pulse'}`}
          >
            <div className="jklm-syllable-box">
              <span className="jklm-syllable-text">
                {gameState.currentSyllable?.toLocaleUpperCase('tr-TR') ?? '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {lastWordResult && (
          <div
            className="animate-feedback-pop"
            style={{
              position: 'absolute',
              bottom: 60,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 16,
              fontWeight: 600,
              color: lastWordResult.ok ? 'var(--jklm-green)' : '#ef4444',
              zIndex: 10,
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
          >
            {lastWordResult.ok ? 'Correct!' : lastWordResult.error}
          </div>
        )}
      </div>

      {/* ===== RIGHT SIDEBAR ===== */}
      <aside className="jklm-sidebar">
        {/* Player stats table */}
        <div style={{ overflow: 'auto', maxHeight: '40%' }}>
          <table className="jklm-stats-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingLeft: 8 }}>Username</th>
                <th>Words</th>
                <th>HP</th>
                <th>Lives</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p: Player) => {
                const isCurrent = p.socketId === gameState.currentPlayerId;
                return (
                  <tr
                    key={p.socketId}
                    className={`${isCurrent ? 'current-row' : ''} ${p.isEliminated ? 'eliminated-row' : ''}`}
                  >
                    <td className="jklm-stats-username" style={{ paddingLeft: 8 }}>
                      {p.nickname?.trim() ?? p.socketId.slice(0, 8)}
                    </td>
                    <td>{p.wordsFound ?? p.score ?? 0}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        width: 20,
                        height: 8,
                        borderRadius: 4,
                        background: p.isEliminated
                          ? '#444'
                          : p.lives >= 3 ? 'var(--jklm-green)' : p.lives >= 2 ? 'var(--jklm-gold)' : '#ef4444',
                      }} />
                    </td>
                    <td>{p.isEliminated ? '💀' : p.lives}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action icons row */}
        <div className="jklm-sidebar-actions">
          <button type="button" title="Sound">🔊</button>
          <button type="button" title="Grid">⊞</button>
          <button type="button" title="Stats">📊</button>
          <button type="button" title="Lock">🔒</button>
        </div>

        {/* Alphabet grid */}
        <div style={{ padding: '4px 8px' }}>
          <div className="jklm-alphabet-grid">
            {ALPHABET.map(letter => {
              const used = myUsedLetters.has(letter);
              return (
                <div key={letter} className="jklm-alpha-row">
                  <span className={`jklm-alpha-letter ${used ? 'used' : 'unused'}`}>
                    {letter}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat */}
        <div className="jklm-chat">
          <div className="jklm-chat-messages">
            {chatMessages.length === 0 && (
              <div style={{ color: 'var(--jklm-text-muted)', fontSize: 11, padding: '4px 0' }}>
                Game started...
              </div>
            )}
            {chatMessages.map(msg => (
              <div key={msg.id} className={`jklm-chat-msg ${msg.type}`}>
                <span className="time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.type === 'chat' && <span className="name">{msg.sender}</span>}
                <span className="text">{msg.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form className="jklm-chat-input" onSubmit={handleChatSubmit}>
            <input
              type="text"
              placeholder="Type here to chat..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
          </form>
        </div>
      </aside>

      {/* ===== BOTTOM BAR ===== */}
      <div className="jklm-bottom-bar">
        {isMyTurn && (
          <span style={{
            background: 'var(--jklm-gold)',
            color: 'var(--jklm-bg-darker)',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            animation: 'timerBlink 0.8s ease-in-out infinite alternate',
          }}>
            YOUR TURN
          </span>
        )}
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', gap: 8, maxWidth: 540, margin: '0 auto' }}>
          <input
            ref={wordInputRef}
            type="text"
            className="jklm-word-input"
            value={word}
            onChange={e => setWord(e.target.value)}
            placeholder={isMyTurn ? 'Type a word...' : 'Waiting for your turn...'}
            disabled={!isMyTurn || submitting}
            autoComplete="off"
            autoFocus
          />
          {isMyTurn && (
            <button
              type="submit"
              disabled={submitting || !word.trim()}
              style={{
                background: 'var(--jklm-green)',
                color: 'var(--jklm-bg-darker)',
                border: 'none',
                borderRadius: 6,
                padding: '0 20px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                opacity: submitting || !word.trim() ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              Send
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
