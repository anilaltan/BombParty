import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { EVENTS } from '../lib/socket';
import { AVATAR_OPTIONS, getAvatarEmoji } from '../lib/avatars';
import type { Player } from '../types/game';

type LobbyProps = {
  onOpenDictionary?: () => void;
  onOpenSettings?: () => void;
};

export function Lobby({ onOpenDictionary, onOpenSettings }: LobbyProps) {
  const { socket, connected, roomId, players, gameState, lastError, clearLastError } = useSocket();
  const [nickname, setNickname]     = useState('');
  const [avatarId, setAvatarId]     = useState('1');
  const [roomCode, setRoomCode]     = useState('');
  const [timeMode, setTimeMode]     = useState<'fixed' | 'range'>('fixed');
  const [fixedSec, setFixedSec]     = useState('15');
  const [minSec, setMinSec]         = useState('10');
  const [maxSec, setMaxSec]         = useState('20');
  const [actionError, setActionError] = useState<string | null>(null);
  const [creating, setCreating]     = useState(false);

  const me      = players.find(p => p.socketId === socket?.id);
  const isReady = me?.ready ?? false;
  const isHost  = me?.isHost ?? false;
  const canStart =
    isHost && players.length >= 2 &&
    players.every(p => p.ready) &&
    gameState?.status === 'waiting';

  const err = actionError ?? lastError;

  const handleCreate = () => {
    setActionError(null);
    clearLastError();
    const name = nickname.trim();
    if (!name) { setActionError('Please enter a nickname'); return; }
    if (!socket) { setActionError('Not connected'); return; }
    const pFixed = Number(fixedSec);
    const pMin   = Number(minSec);
    const pMax   = Number(maxSec);
    if (timeMode === 'fixed' && (!Number.isFinite(pFixed) || pFixed < 3 || pFixed > 60)) {
      setActionError('Fixed time must be 3–60 seconds'); return;
    }
    if (timeMode === 'range' && (!Number.isFinite(pMin) || !Number.isFinite(pMax) || pMin < 3 || pMax > 60 || pMin > pMax)) {
      setActionError('Range must be 3–60 s and min ≤ max'); return;
    }
    setCreating(true);
    const timeout = setTimeout(() => {
      setCreating(false);
      setActionError('Server did not respond. Is the backend running?');
    }, 8000);
    socket.emit(
      EVENTS.CREATE_ROOM,
      {
        nickname: name,
        avatarId,
        turnTime: timeMode === 'fixed'
          ? { mode: 'fixed', fixedSeconds: pFixed }
          : { mode: 'range', minSeconds: pMin, maxSeconds: pMax },
      },
      (res: { ok?: boolean; error?: string }) => {
        clearTimeout(timeout);
        setCreating(false);
        if (res && !res.ok) setActionError(res.error ?? 'Failed to create room');
      },
    );
  };

  const handleJoin = () => {
    const code = roomCode.trim().toUpperCase();
    const name = nickname.trim();
    if (!code) { setActionError('Enter a room code'); return; }
    if (!name) { setActionError('Please enter a nickname'); return; }
    setActionError(null);
    clearLastError();
    socket?.emit(EVENTS.JOIN_ROOM, { roomId: code, nickname: name, avatarId },
      (res: { ok?: boolean; error?: string }) => {
        if (res && !res.ok) setActionError(res.error ?? 'Failed to join room');
      });
  };

  const handleReady = (v: boolean) => {
    setActionError(null);
    socket?.emit(EVENTS.SET_READY, { ready: v },
      (res: { ok?: boolean; error?: string }) => {
        if (res?.error) setActionError(res.error);
      });
  };

  const handleStart = () => {
    setActionError(null);
    socket?.emit(EVENTS.START_GAME, {},
      (res: { ok?: boolean; error?: string }) => {
        if (res && !res.ok) setActionError(res.error ?? 'Failed to start');
      });
  };

  if (!connected) {
    return (
      <div className="bp-lobby">
        <p style={{ color: 'var(--text-2)' }}>Connecting to server…</p>
      </div>
    );
  }

  /* ── Pre-room: create or join ── */
  if (!roomId) {
    return (
      <div className="bp-lobby">

        {/* Brand */}
        <div className="bp-brand" style={{ textAlign: 'center' }}>
          <h1><span>Bomb</span>Party</h1>
          <p>Type words containing the syllable before the bomb explodes!</p>
          <div className="bp-brand-version">v{__APP_VERSION__}</div>
        </div>

        {/* Main card */}
        <div className="bp-card">

          {/* Nickname */}
          <div className="bp-field">
            <label>Nickname</label>
            <input
              type="text"
              className="bp-input"
              placeholder="Enter your name…"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
            />
          </div>

          {/* Avatar */}
          <div className="bp-field">
            <label>Avatar</label>
            <div className="bp-avatars">
              {AVATAR_OPTIONS.map(a => (
                <button
                  key={a.id}
                  type="button"
                  className={`bp-av-btn${avatarId === a.id ? ' picked' : ''}`}
                  onClick={() => setAvatarId(a.id)}
                  title={a.emoji}
                >
                  {a.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Turn duration */}
          <div className="bp-field">
            <label>Turn Duration</label>
            <div className="bp-tabs" style={{ marginBottom: 8 }}>
              <button
                type="button"
                className={`bp-tab ${timeMode === 'fixed' ? 'on' : 'off'}`}
                onClick={() => setTimeMode('fixed')}
              >Fixed</button>
              <button
                type="button"
                className={`bp-tab ${timeMode === 'range' ? 'on' : 'off'}`}
                onClick={() => setTimeMode('range')}
              >Range</button>
            </div>

            {timeMode === 'fixed' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  className="bp-input"
                  min={3} max={60}
                  value={fixedSec}
                  onChange={e => setFixedSec(e.target.value)}
                  style={{ width: 90, textAlign: 'center' }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>seconds</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'Min', val: minSec, set: setMinSec },
                  { label: 'Max', val: maxSec, set: setMaxSec },
                ].map(({ label, val, set }) => (
                  <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-2)', width: 24 }}>{label}</span>
                    <input
                      type="number"
                      className="bp-input"
                      min={3} max={60}
                      value={val}
                      onChange={e => set(e.target.value)}
                      style={{ textAlign: 'center' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create */}
          <button
            type="button"
            className="bp-btn-primary"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? 'Creating…' : '💣 Start a New Room'}
          </button>

          <div className="bp-divider">or join existing</div>

          {/* Join */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="bp-input"
              placeholder="Room code"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ textTransform: 'uppercase', letterSpacing: 3, textAlign: 'center', fontWeight: 700, fontFamily: 'monospace' }}
            />
            <button
              type="button"
              className="bp-btn-secondary"
              onClick={handleJoin}
              style={{ whiteSpace: 'nowrap' }}
            >
              Join
            </button>
          </div>
        </div>

        {/* Utility links */}
        <div style={{ display: 'flex', gap: 8 }}>
          {onOpenSettings && (
            <button type="button" className="bp-btn-secondary" onClick={onOpenSettings}>
              ⚙ Settings
            </button>
          )}
          {onOpenDictionary && (
            <button type="button" className="bp-btn-secondary" onClick={onOpenDictionary}>
              📖 Dictionary
            </button>
          )}
        </div>

        {err && <p className="bp-error">{err}</p>}
      </div>
    );
  }

  /* ── In-room: waiting for start ── */
  return (
    <div className="bp-room-view">

      {/* Room code */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-3)' }}>
          Room Code
        </p>
        <div className="bp-code-display">{roomId}</div>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-2)' }}>
          Share this code to invite friends
        </p>
      </div>

      {/* Player list */}
      <div style={{ width: '100%', maxWidth: 360 }}>
        {players.map((p: Player) => (
          <div key={p.socketId} className="bp-player-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{getAvatarEmoji(p.avatarId)}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                  {p.nickname || p.socketId.slice(0, 8)}
                </div>
                {p.isHost && <span className="bp-host-tag">host</span>}
              </div>
            </div>
            <div className="bp-ready-indicator">
              <div className={`bp-ready-dot ${p.ready ? 'yes' : 'no'}`} />
              <span style={{ color: p.ready ? 'var(--green)' : 'var(--text-3)', fontSize: 11 }}>
                {p.ready ? 'Ready' : 'Not ready'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          type="button"
          className="bp-btn-secondary"
          onClick={() => handleReady(!isReady)}
          style={{
            borderColor: isReady ? 'rgba(34,197,94,0.35)' : undefined,
            color: isReady ? 'var(--green)' : undefined,
            background: isReady ? 'var(--green-dim)' : undefined,
          }}
        >
          {isReady ? '✓ Ready' : 'Ready Up'}
        </button>

        {isHost && (
          <button
            type="button"
            className="bp-btn-primary"
            onClick={handleStart}
            disabled={!canStart}
            style={{ width: 'auto', paddingLeft: 28, paddingRight: 28 }}
          >
            Start Game
          </button>
        )}
      </div>

      {err && <p className="bp-error">{err}</p>}
    </div>
  );
}
