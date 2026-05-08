import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSettings } from '../context/SettingsContext';
import { useI18n } from '../context/I18nContext';
import { EVENTS } from '../lib/socket';
import { getAvatarEmoji } from '../lib/avatars';
import type { Player, ChatMessage } from '../types/game';

const DEFAULT_TURN_DURATION_MS = 15000;
const ALPHABET = ['A','B','C','Ç','D','E','F','G','Ğ','H','I','İ','J','K','L','M','N','O','Ö','P','R','S','Ş','T','U','Ü','V','Y','Z'];
const EMPTY_WORDS: string[] = [];

interface PlayerCardProps {
  p: Player;
  pos: { x: number; y: number; angle: number };
  active: boolean;
  liveWord: string;
  myWords: string[];
}

const PlayerCard = memo(function PlayerCard({ p, pos, active, liveWord, myWords }: PlayerCardProps) {
  return (
    <div
      className={`bp-player${p.isEliminated ? ' eliminated' : ''}`}
      style={{ left: pos.x - 54, top: pos.y - 50, width: 108 }}
    >
      <span className="bp-player-name">{p.nickname?.trim() ?? p.socketId.slice(0, 10)}</span>
      <div className={`bp-avatar-card${active ? ' active' : ''}`}>
        {getAvatarEmoji(p.avatarId)}
        {active && <div className="bp-active-ring" />}
      </div>
      <div className="bp-hearts">
        {Array.from({ length: Math.max(p.lives, 3) }).map((_, li) => (
          <span key={li} className={`bp-heart${li >= p.lives ? ' lost' : ''}`}>♥</span>
        ))}
      </div>
      {liveWord && <span className="bp-live-word">{liveWord}</span>}
      {myWords.length > 0 && (
        <div className="bp-player-words">
          {myWords.slice(-4).map(w => (
            <span key={w} className="bp-player-word-chip">{w}</span>
          ))}
        </div>
      )}
    </div>
  );
});


export function Game() {
  const {
    socket, connected, roomId, players, gameState,
    liveAttempt, lastWordResult, gameEnd,
    clearLastWordResult, clearGameEnd, leaveRoom,
  } = useSocket();
  const { soundEnabled } = useSettings();
  const { t } = useI18n();

  const [word, setWord] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [invalidFlash, setInvalidFlash] = useState(false);
  const [validFlash, setValidFlash] = useState(false);
  const [urgent, setUrgent] = useState(false);
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

  const isPremium = localStorage.getItem('bombparty-premium') === 'true';
  const isMyTurn = gameState?.status === 'playing' && gameState.currentPlayerId === socket?.id;

  useEffect(() => {
    if (!gameEnd || isPremium) return;
    try {
      ((window as { adsbygoogle?: unknown[] }).adsbygoogle ??= []).push({});
    } catch { /* ignore */ }
  }, [!!gameEnd]);

  // Broadcast live attempt
  useEffect(() => {
    if (gameState?.status !== 'playing' || !isMyTurn) return;
    socket?.emit(EVENTS.WORD_ATTEMPT, { word });
  }, [gameState?.status, isMyTurn, socket, word]);

  // Countdown timer — only updates `urgent` state, not a numeric value, so ticking
  // does not cause full re-renders. React bails out when the boolean value is unchanged.
  useEffect(() => {
    if (gameState?.status !== 'playing' || !gameState.currentPlayerId) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setUrgent(false);
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
      const secs = Math.ceil(left / 1000);
      setUrgent(left > 0 && secs <= 5);
      if (left <= 0) {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        return;
      }
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

  // Incoming chat messages from other players (and echo of own messages)
  useEffect(() => {
    if (!socket) return;
    const handler = (msg: { id: string; senderId: string; sender: string; text: string; timestamp: number }) => {
      setChatMessages(prev => [...prev.slice(-100), { ...msg, type: 'chat' as const }]);
    };
    socket.on(EVENTS.CHAT_MESSAGE, handler);
    return () => { socket.off(EVENTS.CHAT_MESSAGE, handler); };
  }, [socket]);

  const handleChat = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    socket?.emit(EVENTS.CHAT_MESSAGE, { text });
    setChatInput('');
  };

  // Letters used by the current player (per-player tracking)
  const myUsedLetters = useMemo(() => {
    const myPlayer = players.find(p => p.socketId === socket?.id);
    return new Set<string>(myPlayer?.usedLetters ?? []);
  }, [players, socket?.id]);

  // Player positions around the arena
  const playerPositions = useMemo(() => {
    const n = Math.max(players.length, 1);
    const cx = arenaSize.w / 2;
    const cy = arenaSize.h / 2;
    const rx = Math.min(arenaSize.w * 0.38, 270);
    const ry = Math.min(arenaSize.h * 0.36, 210);
    const startAngle = n === 2 ? 0 : -Math.PI / 2;
    return players.map((_, i) => {
      const angle = (2 * Math.PI * i) / n + startAngle;
      return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle), angle };
    });
  }, [players.length, arenaSize]);

  // Arrow computations: only recalculate when active player or positions change
  const arrowComputations = useMemo(() => {
    const cx = arenaSize.w / 2;
    const cy = arenaSize.h / 2;
    const idx = gameState?.currentPlayerId
      ? players.findIndex(p => p.socketId === gameState.currentPlayerId)
      : -1;
    const target = idx >= 0 ? playerPositions[idx] : null;
    const length = target ? Math.sqrt((target.x - cx) ** 2 + (target.y - cy) ** 2) - 58 : 0;
    return { currentIdx: idx, arrowTarget: target, arrowLength: length, arrowAngle: target?.angle ?? 0 };
  }, [gameState?.currentPlayerId, players, playerPositions, arenaSize]);

  const flashClass = useMemo(() => [
    invalidFlash && 'shake-on-invalid flash-red-on-invalid',
    validFlash   && 'flash-green-on-valid',
  ].filter(Boolean).join(' '), [invalidFlash, validFlash]);

  if (!connected) {
    return (
      <div className="bp-lobby">
        <p style={{ color: 'var(--text-2)' }}>{t.connecting}</p>
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
            {gameEnd.winner ? (iWon ? t.youWin : t.gameOver) : t.draw}
          </h1>
          {winner && (
            <p style={{ margin: 0, fontSize: 15, color: iWon ? 'var(--yellow)' : 'var(--text-2)' }}>
              {winner.nickname?.trim() || winner.socketId.slice(0, 8)} {t.wins}
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
            <span className="bp-section-label">{t.finalScores}</span>
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

        {!isPremium && (
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: 300, height: 250 }}
            data-ad-client="ca-pub-XXXXXXXXXX"
            data-ad-slot="2222222222"
            data-ad-format="rectangle"
          />
        )}

        <button type="button" className="bp-btn-secondary" style={{ minWidth: 180 }} onClick={clearGameEnd}>
          {t.backToLobby}
        </button>
      </div>
    );
  }

  if (gameState?.status !== 'playing' || !roomId) return null;

  const { currentIdx, arrowTarget, arrowLength, arrowAngle } = arrowComputations;
  const cx = arenaSize.w / 2;
  const cy = arenaSize.h / 2;
  const n  = players.length;
  const wordsPlayed  = gameState.usedWords?.length ?? 0;

  return (
    <div className={`bp-layout ${flashClass}`}>

      {/* ── Header ── */}
      <header className="bp-header">
        <div className="bp-logo">
          <img src="/white-icon.png" alt="KelimeBombası" />
          <span>Kelime<span className="bp-logo-accent">Bombası</span></span>
        </div>
        <span className="bp-header-version">v{__APP_VERSION__}</span>
        <div className="bp-header-sep" />
        <span className="bp-room-pill">{roomId}</span>
        <div className="bp-player-count">{n}</div>
        <div style={{ flex: 1 }} />
        <span className="bp-words-count">{t.words(wordsPlayed)}</span>
        <div className="bp-header-sep" />
        <button type="button" className="bp-btn-secondary" onClick={leaveRoom} style={{ fontSize: 12, padding: '4px 12px' }}>
          {t.quitGame}
        </button>
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
            const myWords = gameState.usedWordsByPlayer?.[p.socketId] ?? EMPTY_WORDS;
            return (
              <PlayerCard
                key={p.socketId}
                p={p}
                pos={pos}
                active={active}
                liveWord={liveWord}
                myWords={myWords}
              />
            );
          })}

          {/* Turn arrow: line from bomb to active player */}
          {arrowTarget && currentIdx >= 0 && (
            <svg
              className="bp-turn-arrow"
              viewBox={`0 0 ${arenaSize.w} ${arenaSize.h}`}
              style={{ width: arenaSize.w, height: arenaSize.h, position: 'absolute', inset: 0 }}
            >
              <defs>
                <marker id="ah" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0,10 3.5,0 7" fill="var(--yellow)" />
                </marker>
                <filter id="glow">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="var(--yellow)" floodOpacity="0.6" />
                </filter>
              </defs>
              <line
                x1={cx} y1={cy}
                x2={cx + arrowLength * Math.cos(arrowAngle)}
                y2={cy + arrowLength * Math.sin(arrowAngle)}
                stroke="var(--yellow)"
                strokeWidth="2.5"
                strokeLinecap="round"
                markerEnd="url(#ah)"
                filter="url(#glow)"
              />
            </svg>
          )}

          {/* Bouncing indicator above active player's card */}
          {arrowTarget && (
            <div
              className="bp-turn-indicator"
              style={{ left: arrowTarget.x - 10, top: arrowTarget.y - 80 }}
            >▼</div>
          )}

          {/* Bomb center */}
          <div className="bp-bomb-center">
            <div className={`bp-bomb-ring ${urgent ? 'urgent' : 'idle'}`}>
              <span className="bp-syllable">
                {gameState.currentSyllable?.toLocaleUpperCase('tr-TR') ?? '—'}
              </span>
              <span className="bp-syllable-hint">{t.syllable}</span>
            </div>
          </div>

          {/* Feedback */}
          {lastWordResult && (
            <div
              className="bp-feedback"
              style={{ color: lastWordResult.ok ? 'var(--green)' : 'var(--red)' }}
            >
              {lastWordResult.ok ? t.correct : lastWordResult.error}
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside className="bp-sidebar">
        {/* Stats */}
        <div className="bp-sidebar-header">
          <span className="bp-section-label">{t.players}</span>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: '38%' }} className="bp-scroll">
          <table className="bp-stats-table">
            <thead>
              <tr>
                <th>{t.name}</th>
                <th>{t.wordsHeader}</th>
                <th>{t.lives}</th>
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
          <div style={{ padding: '0 4px 4px' }}><span className="bp-section-label">{t.yourLetters}</span></div>
          <div className="bp-alphabet">
            {ALPHABET.map(letter => (
              <div key={letter} className={`bp-letter ${myUsedLetters.has(letter) ? 'used' : 'unused'}`}>
                {letter}
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="bp-chat">
          <div style={{ padding: '6px 10px 4px', borderBottom: '1px solid var(--border)' }}>
            <span className="bp-section-label">{t.chat}</span>
          </div>
          <div className="bp-chat-messages">
            {chatMessages.length === 0 && (
              <span style={{ color: 'var(--text-3)', fontSize: 11 }}>{t.noMessages}</span>
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
              placeholder={t.chatPlaceholder}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
          </form>
        </div>
      </aside>

      {/* ── Bottom bar ── */}
      <div className="bp-bottom-bar">
        {isMyTurn && <span className="bp-your-turn">{t.yourTurn}</span>}
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', gap: 8, maxWidth: 540, margin: '0 auto' }}>
          <input
            ref={wordInputRef}
            type="text"
            className="bp-word-input"
            value={word}
            onChange={e => setWord(e.target.value)}
            placeholder={isMyTurn ? t.typeWord : t.waitingTurn}
            disabled={!isMyTurn || submitting}
            autoComplete="off"
          />
          {isMyTurn && (
            <button type="submit" className="bp-submit-btn" disabled={submitting || !word.trim()}>
              {t.send}
            </button>
          )}
        </form>
      </div>

    </div>
  );
}
