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
  const [nickname, setNickname] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('1');
  const [roomCode, setRoomCode] = useState('');
  const [timeMode, setTimeMode] = useState<'fixed' | 'range'>('fixed');
  const [fixedSeconds, setFixedSeconds] = useState('15');
  const [minSeconds, setMinSeconds] = useState('10');
  const [maxSeconds, setMaxSeconds] = useState('20');
  const [actionError, setActionError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const me = players.find((p) => p.socketId === socket?.id);
  const isReady = me?.ready ?? false;
  const isHost = me?.isHost ?? false;
  const canStart =
    isHost &&
    players.length >= 2 &&
    players.every((p) => p.ready) &&
    gameState?.status === 'waiting';

  const handleCreateRoom = () => {
    setActionError(null);
    clearLastError();
    const name = nickname.trim();
    if (!name) { setActionError('Please enter a nickname'); return; }
    if (!socket) { setActionError('Not connected'); return; }
    const parsedFixed = Number(fixedSeconds);
    const parsedMin = Number(minSeconds);
    const parsedMax = Number(maxSeconds);
    if (timeMode === 'fixed' && (!Number.isFinite(parsedFixed) || parsedFixed < 3 || parsedFixed > 60)) {
      setActionError('Fixed time must be 3-60 seconds');
      return;
    }
    if (timeMode === 'range' && (!Number.isFinite(parsedMin) || !Number.isFinite(parsedMax) || parsedMin < 3 || parsedMax > 60 || parsedMin > parsedMax)) {
      setActionError('Range must be 3-60 and min <= max');
      return;
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
        avatarId: selectedAvatarId,
        turnTime:
          timeMode === 'fixed'
            ? { mode: 'fixed', fixedSeconds: parsedFixed }
            : { mode: 'range', minSeconds: parsedMin, maxSeconds: parsedMax },
      },
      (res: { ok?: boolean; error?: string }) => {
        clearTimeout(timeout);
        setCreating(false);
        if (res && !res.ok) setActionError(res.error ?? 'Failed to create room');
      }
    );
  };

  const handleJoinRoom = () => {
    const code = roomCode.trim().toUpperCase();
    if (!code) { setActionError('Enter room code'); return; }
    const name = nickname.trim();
    if (!name) { setActionError('Please enter a nickname'); return; }
    setActionError(null);
    clearLastError();
    socket?.emit(EVENTS.JOIN_ROOM, { roomId: code, nickname: name, avatarId: selectedAvatarId }, (res: { ok?: boolean; error?: string }) => {
      if (res && !res.ok) setActionError(res.error ?? 'Failed to join room');
    });
  };

  const handleSetReady = (value: boolean) => {
    setActionError(null);
    socket?.emit(EVENTS.SET_READY, { ready: value }, (res: { ok?: boolean; error?: string }) => {
      if (res?.error) setActionError(res.error);
    });
  };

  const handleStartGame = () => {
    setActionError(null);
    socket?.emit(EVENTS.START_GAME, {}, (res: { ok?: boolean; error?: string }) => {
      if (res && !res.ok) setActionError(res.error ?? 'Failed to start');
    });
  };

  const err = actionError ?? lastError;

  if (!connected) {
    return (
      <div className="jklm-lobby">
        <p style={{ color: 'var(--jklm-gold)' }}>Connecting to server...</p>
      </div>
    );
  }

  // Pre-room: Create or Join
  if (!roomId) {
    return (
      <div className="jklm-lobby">
        <h1>
          <span className="jklm-lobby-title-accent">Bomb</span>Party
        </h1>
        <p style={{ color: 'var(--jklm-text-muted)', fontSize: 13, marginTop: -8, textAlign: 'center' }}>
          Word game — type words containing the syllable before time runs out!
        </p>

        <div className="jklm-lobby-card">
          {/* Nickname */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--jklm-text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Nickname
            </label>
            <input
              type="text"
              placeholder="Enter your name..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          {/* Avatar picker */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--jklm-text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Avatar
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {AVATAR_OPTIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAvatarId(a.id)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    fontSize: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: selectedAvatarId === a.id ? '2px solid var(--jklm-gold)' : '2px solid rgba(255,255,255,0.1)',
                    background: selectedAvatarId === a.id ? 'rgba(234,179,8,0.1)' : 'var(--jklm-bg-darker)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {a.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Turn time settings */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--jklm-text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Turn Duration
            </label>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              <button
                type="button"
                onClick={() => setTimeMode('fixed')}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: timeMode === 'fixed' ? 'var(--jklm-gold)' : 'rgba(255,255,255,0.06)',
                  color: timeMode === 'fixed' ? 'var(--jklm-bg-darker)' : 'var(--jklm-text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                Fixed
              </button>
              <button
                type="button"
                onClick={() => setTimeMode('range')}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: timeMode === 'range' ? 'var(--jklm-gold)' : 'rgba(255,255,255,0.06)',
                  color: timeMode === 'range' ? 'var(--jklm-bg-darker)' : 'var(--jklm-text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                Range
              </button>
            </div>
            {timeMode === 'fixed' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--jklm-text-muted)' }}>Seconds</span>
                <input
                  type="number"
                  min={3}
                  max={60}
                  value={fixedSeconds}
                  onChange={(e) => setFixedSeconds(e.target.value)}
                  style={{ width: 80, textAlign: 'center' }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--jklm-text-muted)' }}>Min</span>
                  <input
                    type="number"
                    min={3}
                    max={60}
                    value={minSeconds}
                    onChange={(e) => setMinSeconds(e.target.value)}
                    style={{ width: '100%', textAlign: 'center' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--jklm-text-muted)' }}>Max</span>
                  <input
                    type="number"
                    min={3}
                    max={60}
                    value={maxSeconds}
                    onChange={(e) => setMaxSeconds(e.target.value)}
                    style={{ width: '100%', textAlign: 'center' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Create button */}
          <button
            type="button"
            className="jklm-lobby-btn-primary"
            onClick={handleCreateRoom}
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Start a New Room'}
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'var(--jklm-text-muted)',
            fontSize: 12,
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--jklm-border)' }} />
            <span>or join existing</span>
            <div style={{ flex: 1, height: 1, background: 'var(--jklm-border)' }} />
          </div>

          {/* Join room */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', fontWeight: 700 }}
            />
            <button
              type="button"
              className="jklm-lobby-btn-secondary"
              onClick={handleJoinRoom}
              style={{ whiteSpace: 'nowrap' }}
            >
              Join
            </button>
          </div>
        </div>

        {/* Utility buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {onOpenSettings && (
            <button type="button" className="jklm-lobby-btn-secondary" onClick={onOpenSettings}>
              Settings
            </button>
          )}
          {onOpenDictionary && (
            <button type="button" className="jklm-lobby-btn-secondary" onClick={onOpenDictionary}>
              Dictionary
            </button>
          )}
        </div>

        {err && (
          <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{err}</p>
        )}
      </div>
    );
  }

  // In-room: waiting for game start
  return (
    <div className="jklm-room-view">
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--jklm-text-muted)', fontSize: 13, marginBottom: 4 }}>Room Code</p>
        <div className="jklm-room-code">{roomId}</div>
        <p style={{ color: 'var(--jklm-text-muted)', fontSize: 12, marginTop: 4 }}>
          Share this code to invite others
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 360 }}>
        {players.map((p: Player) => (
          <div key={p.socketId} className="jklm-player-list-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{getAvatarEmoji(p.avatarId)}</span>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--jklm-text)' }}>
                  {p.nickname || p.socketId.slice(0, 8)}
                </div>
                {p.isHost && (
                  <span style={{ fontSize: 10, color: 'var(--jklm-gold)', fontWeight: 700 }}>HOST</span>
                )}
              </div>
            </div>
            <span className={`jklm-ready-badge ${p.ready ? 'ready' : 'not-ready'}`}>
              {p.ready ? 'Ready' : 'Not Ready'}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          className="jklm-lobby-btn-secondary"
          onClick={() => handleSetReady(!isReady)}
          style={{
            background: isReady ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.08)',
            borderColor: isReady ? 'rgba(74,222,128,0.3)' : 'var(--jklm-border)',
            color: isReady ? 'var(--jklm-green)' : 'var(--jklm-text)',
          }}
        >
          {isReady ? '✓ Ready' : 'Click to Ready Up'}
        </button>
      </div>

      {isHost && (
        <button
          type="button"
          className="jklm-lobby-btn-primary"
          onClick={handleStartGame}
          disabled={!canStart}
          style={{ maxWidth: 240 }}
        >
          Start Game
        </button>
      )}

      {err && (
        <p style={{ color: '#ef4444', fontSize: 13 }}>{err}</p>
      )}
    </div>
  );
}
