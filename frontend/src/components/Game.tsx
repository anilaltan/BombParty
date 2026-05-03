import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSettings } from '../context/SettingsContext';
import { EVENTS } from '../lib/socket';
import { getAvatarEmoji } from '../lib/avatars';
import type { Player, ChatMessage } from '../types/game';

const DEFAULT_TURN_DURATION_MS = 15000;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function formatTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function Game() {
  const {
    socket, connected, roomId, players, gameState,
    liveAttempt, lastWordResult, gameEnd,
    clearLastWordResult, clearGameEnd,
  } = useSocket();
  const { soundEnabled } = useSettings();

  const [word, setWord] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [invalidFlash, setInvalidFlash] = useState(false);
  const [validFlash, setValidFlash] = useState(false);
  const [timerMs, setTimerMs] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const endAtRef     = useRef<number | null>(null);
  const lastTickRef  = useRef<number>(0);
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const chatEndRef   = useRef<HTMLDivElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);
  const arenaRef     = useRef<HTMLDivElement>(null);
  const [arenaSize, setArenaSize] = useState({ w: 600, h: 500 });

  useEffect(() => {
    if (!arenaRef.current) return;
    const obs = new ResizeObserver(entries => {
      const e = entries[0];
      if (e) setArenaSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    obs.observe(arenaRef.current);
    return () => obs.disconnect();
  }, []);

  const getAudioCtx = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (Ctx) audioCtxRef.current = new Ctx();
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((freq: number, duration: number, vol = 0.12) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch { /* ignore */ }
  }, [getAudioCtx, soundEnabled]);

  const playDing = useCallback(() => playTone(880, 0.15, 0.15), [playTone]);
  const playTick = useCallback(() => playTone(1200, 0.05, 0.08), [playTone]);

  const isMyTurn = gameState?.status === 'playing' && gameState.currentPlayerId === socket?.id;

  // Broadcast live attempt
  useEffect(() => {
    if (gameState?.status !== 'playing' || !isMyTurn) return;
    socket?.emit(EVENTS.WORD_ATTEMPT, { word });
  }, [gameState?.status, isMyTurn, socket, word]);

  // Countdown timer
  useEffect(() => {
    if (gameState?.status !== 'playing' || !gameState.currentPlayerId) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setTimerMs(null);
      endAtRef.current = null;
      return;
    }
    const endAt = gameState.turnExpiresAt
      ? gameState.turnExpiresAt
      : Date.now() + (gameState.turnDurationMs ?? DEFAULT_TURN_DURATION_MS);
    endAtRef.current = endAt;
    lastTickRef.current = Date.now();
    const myTurnTick = gameState.currentPlayerId === socket?.id;

    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, endAtRef.current! - now);
      setTimerMs(left);
      if (left <= 0) {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        return;
      }
      const secs = Math.ceil(left / 1000);
      const interval = secs > 10 ? 1000 : secs > 5 ? 500 : 250;
      if (myTurnTick && soundEnabled && now - lastTickRef.current >= interval) {
        lastTickRef.current = now;
        playTick();
      }
    };
    tick();
    timerRef.current = setInterval(tick, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState?.status, gameState?.currentPlayerId, gameState?.turnExpiresAt, socket?.id, playTick, soundEnabled]);

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
    const t = setTimeout(() => setValidFlash(false), 500);
    return () => clearTimeout(t);
  }, [lastWordResult, playDing, soundEnabled]);

  // My-turn ding
  const prevTurnRef = useRef(false);
  useEffect(() => {
    if (gameState?.status !== 'playing') { prevTurnRef.current = false; return; }
    if (isMyTurn && !prevTurnRef.current) {
      if (soundEnabled) playDing();
      wordInputRef.current?.focus();
    }
    prevTurnRef.current = isMyTurn;
  }, [gameState?.status, isMyTurn, playDing, soundEnabled]);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const w = word.trim();
    if (!w || submitting || !isMyTurn) return;
    setSubmitting(true);
    clearLastWordResult();
    socket?.emit(EVENTS.SUBMIT_WORD, { word: w }, (res: { ok?: boolean }) => {
      setSubmitting(false);
      if (res?.ok) setWord('');
    });
  };

  const handleChat = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const me = players.find(p => p.socketId === socket?.id);
    setChatMessages(prev => [...prev.slice(-100), {
      id: `${Date.now()}-${Math.random()}`,
      sender: me?.nickname ?? socket?.id?.slice(0, 8) ?? 'You',
      text,
      timestamp: Date.now(),
      type: 'chat',
    }]);
    setChatInput('');
  };

  // Letters used across all round words
  const roundUsedLetters = useMemo(() => {
    const s = new Set<string>();
    for (const w of gameState?.usedWords ?? [])
      for (const c of w.toUpperCase())
        if (/[A-ZÇĞIİÖŞÜ]/.test(c)) s.add(c);
    return s;
  }, [gameState?.usedWords]);

  // Player positions around the arena
  const playerPositions = useMemo(() => {
    const n = Math.max(players.length, 1);
    const cx = arenaSize.w / 2;
    const cy = arenaSize.h / 2;
    const rx = Math.min(arenaSize.w * 0.38, 270);
    const ry = Math.min(arenaSize.h * 0.36, 210);
    return players.map((_, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle), angle };
    });
  }, [players.length, arenaSize]);

  if (!connected) {
    return (
      <div className="bp-lobby">
        <p style={{ color: 'var(--text-2)' }}>Connecting…</p>
      </div>
    );
  }

  // ── Game end screen ──
  if (gameEnd) {
    const winner = gameEnd.players.find(p => p.socketId === gameEnd.winner);
    const sorted = [...gameEnd.players].sort((a, b) => b.score - a.score);
    const iWon   = gameEnd.winner === socket?.id;

    return (
      <div className="bp-end">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>{gameEnd.winner ? '💣' : '🤝'}</div>
          <h1 style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 900, color: 'white' }}>
            {gameEnd.winner ? (iWon ? 'You Win!' : 'Game Over') : 'Draw'}
          </h1>
          {winner && (
            <p style={{ margin: 0, fontSize: 15, color: iWon ? 'var(--yellow)' : 'var(--text-2)' }}>
              {winner.nickname?.trim() || winner.socketId.slice(0, 8)} wins!
            </p>
          )}
        </div>

        <div style={{
          width: '100%', maxWidth: 300,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
            <span className="bp-section-label">Final scores</span>
          </div>
          {sorted.map((p, i) => (
            <div key={p.socketId ?? i} className={`bp-end-score-row${p.socketId === gameEnd.winner ? ' winner-row' : ''}`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-3)', fontSize: 12, width: 18 }}>#{i + 1}</span>
                <span style={{ fontSize: 18 }}>{getAvatarEmoji(p.avatarId)}</span>
                <span style={{ fontWeight: 700, color: p.socketId === gameEnd.winner ? 'var(--yellow)' : 'var(--text)', fontSize: 13 }}>
                  {p.nickname?.trim() || p.socketId?.slice(0, 8) || '—'}
                </span>
              </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15 }}>{p.score}</span>
            </div>
          ))}
        </div>

        <button type="button" className="bp-btn-secondary" style={{ minWidth: 180 }} onClick={clearGameEnd}>
          Back to Lobby
        </button>
      </div>
    );
  }

  if (gameState?.status !== 'playing' || !roomId) return null;

  const cx = arenaSize.w / 2;
  const cy = arenaSize.h / 2;
  const n  = players.length;
  const currentIdx = gameState.currentPlayerId
    ? players.findIndex(p => p.socketId === gameState.currentPlayerId)
    : -1;
  const arrowTarget  = currentIdx >= 0 ? playerPositions[currentIdx] : null;
  const arrowLength  = arrowTarget ? Math.sqrt((arrowTarget.x - cx) ** 2 + (arrowTarget.y - cy) ** 2) - 58 : 0;
  const arrowAngle   = arrowTarget?.angle ?? 0;
  const timerSecs    = timerMs !== null ? Math.ceil(timerMs / 1000) : null;
  const urgent       = timerSecs !== null && timerSecs <= 5;
  const wordsPlayed  = gameState.usedWords?.length ?? 0;

  const flashClass = [
    invalidFlash && 'shake-on-invalid flash-red-on-invalid',
    validFlash   && 'flash-green-on-valid',
  ].filter(Boolean).join(' ');

  return (
    <div className={`bp-layout ${flashClass}`}>

      {/* ── Header ── */}
      <header className="bp-header">
        <div className="bp-logo">
          <span>💣</span>
          <span>BombParty</span>
        </div>
        <span className="bp-header-version">v{__APP_VERSION__}</span>
        <div className="bp-header-sep" />
        <span className="bp-room-pill">{roomId}</span>
        <div className="bp-player-count">{n}</div>
        <div style={{ flex: 1 }} />
        <span className="bp-words-count">{wordsPlayed} words</span>
        <div className="bp-header-sep" />
        <span className={`bp-timer-large ${urgent ? 'urgent' : ''}`}>
          {timerMs !== null ? formatTime(timerMs) : '00:00'}
        </span>
      </header>

      {/* ── Game area ── */}
      <div className="bp-game-area" ref={arenaRef}>
        <div className="bp-arena">

          {/* Players */}
          {players.map((p: Player, i: number) => {
            const pos = playerPositions[i];
            if (!pos) return null;
            const active = p.socketId === gameState.currentPlayerId;
            const liveWord = active ? (liveAttempt?.word ?? '').toUpperCase() : '';
            return (
              <div
                key={p.socketId}
                className={`bp-player${p.isEliminated ? ' eliminated' : ''}`}
                style={{ left: pos.x - 50, top: pos.y - 50, width: 100 }}
              >
                <span className="bp-player-name">{p.nickname?.trim() ?? p.socketId.slice(0, 10)}</span>
                <div className={`bp-avatar-card${active ? ' active' : ''}`}>
                  {getAvatarEmoji(p.avatarId)}
                  {active && <div className="bp-active-ring" />}
                </div>
                <div className="bp-hearts">
                  {Array.from({ length: 3 }).map((_, li) => (
                    <span key={li} className={`bp-heart${li >= p.lives ? ' lost' : ''}`}>♥</span>
                  ))}
                </div>
                {liveWord && <span className="bp-live-word">{liveWord}</span>}
              </div>
            );
          })}

          {/* Arrow */}
          {arrowTarget && currentIdx >= 0 && (
            <>
              <svg
                className="bp-turn-arrow"
                viewBox={`0 0 ${arenaSize.w} ${arenaSize.h}`}
                preserveAspectRatio="none"
                style={{ width: arenaSize.w, height: arenaSize.h, position: 'absolute', inset: 0 }}
              >
                <defs>
                  <marker id="ah" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto">
                    <polygon points="0 0,12 4,0 8" fill="var(--red)" opacity="0.8" />
                  </marker>
                  <filter id="glow">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="var(--red)" floodOpacity="0.5" />
                  </filter>
                </defs>
                <line
                  x1={cx} y1={cy}
                  x2={cx + arrowLength * Math.cos(arrowAngle)}
                  y2={cy + arrowLength * Math.sin(arrowAngle)}
                  stroke="var(--red)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="6 4"
                  markerEnd="url(#ah)"
                  filter="url(#glow)"
                  opacity="0.75"
                />
              </svg>
              <div
                className="bp-turn-star"
                style={{
                  left: cx + (arrowLength * 0.52) * Math.cos(arrowAngle) - 8,
                  top:  cy + (arrowLength * 0.52) * Math.sin(arrowAngle) - 8,
                }}
              >⭐</div>
            </>
          )}

          {/* Bomb center */}
          <div className="bp-bomb-center">
            <div className={`bp-bomb-ring ${urgent ? 'urgent' : 'idle'}`}>
              <span className="bp-syllable">
                {gameState.currentSyllable?.toLocaleUpperCase('tr-TR') ?? '—'}
              </span>
              <span className="bp-syllable-hint">syllable</span>
            </div>
          </div>

          {/* Feedback */}
          {lastWordResult && (
            <div
              className="bp-feedback"
              style={{ color: lastWordResult.ok ? 'var(--green)' : 'var(--red)' }}
            >
              {lastWordResult.ok ? '✓ Correct!' : lastWordResult.error}
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside className="bp-sidebar">
        {/* Stats */}
        <div className="bp-sidebar-header">
          <span className="bp-section-label">Players</span>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: '38%' }} className="bp-scroll">
          <table className="bp-stats-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Words</th>
                <th>Lives</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p: Player) => {
                const active = p.socketId === gameState.currentPlayerId;
                const isMe   = p.socketId === socket?.id;
                return (
                  <tr key={p.socketId} className={`${active ? 'active-row' : ''} ${p.isEliminated ? 'elim-row' : ''}`}>
                    <td>
                      <span className={`bp-stats-name${isMe ? ' me' : ''}`}>
                        {p.nickname?.trim() ?? p.socketId.slice(0, 8)}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.score ?? 0}</td>
                    <td>{p.isEliminated ? '💀' : p.lives}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Alphabet */}
        <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '8px 6px 4px' }}>
          <div style={{ padding: '0 4px 4px' }}><span className="bp-section-label">Used letters</span></div>
          <div className="bp-alphabet">
            {ALPHABET.map(letter => (
              <div key={letter} className={`bp-letter ${roundUsedLetters.has(letter) ? 'used' : 'unused'}`}>
                {letter}
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="bp-chat">
          <div style={{ padding: '6px 10px 4px', borderBottom: '1px solid var(--border)' }}>
            <span className="bp-section-label">Chat</span>
          </div>
          <div className="bp-chat-messages">
            {chatMessages.length === 0 && (
              <span style={{ color: 'var(--text-3)', fontSize: 11 }}>No messages yet…</span>
            )}
            {chatMessages.map(msg => (
              <div key={msg.id} className={`bp-chat-msg ${msg.type}`}>
                <span className="time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.type === 'chat' && <span className="name">{msg.sender}</span>}
                <span className="text">{msg.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form className="bp-chat-form" onSubmit={handleChat}>
            <input
              type="text"
              className="bp-chat-input"
              placeholder="Chat…"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
          </form>
        </div>
      </aside>

      {/* ── Bottom bar ── */}
      <div className="bp-bottom-bar">
        {isMyTurn && <span className="bp-your-turn">Your Turn</span>}
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', gap: 8, maxWidth: 540, margin: '0 auto' }}>
          <input
            ref={wordInputRef}
            type="text"
            className="bp-word-input"
            value={word}
            onChange={e => setWord(e.target.value)}
            placeholder={isMyTurn ? 'Type a word…' : 'Waiting for your turn…'}
            disabled={!isMyTurn || submitting}
            autoComplete="off"
          />
          {isMyTurn && (
            <button type="submit" className="bp-submit-btn" disabled={submitting || !word.trim()}>
              Send
            </button>
          )}
        </form>
      </div>

    </div>
  );
}
