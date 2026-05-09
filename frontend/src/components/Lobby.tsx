import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useI18n } from '../context/I18nContext';
import { EVENTS } from '../lib/socket';
import { trackEvent } from '../lib/gtag';
import { AVATAR_OPTIONS, getAvatarEmoji } from '../lib/avatars';
import type { Player } from '../types/game';

type LobbyProps = {
  onOpenDictionary?: () => void;
  onOpenSettings?: () => void;
  initialRoomCode?: string;
};

export function Lobby({ onOpenDictionary, onOpenSettings, initialRoomCode }: LobbyProps) {
  const { socket, connected, roomId, players, gameState, lastError, clearLastError, leaveRoom } = useSocket();
  const { t, lang, setLang } = useI18n();
  const [nickname, setNickname]     = useState('');
  const [avatarId, setAvatarId]     = useState('1');
  const [roomCode, setRoomCode]     = useState(initialRoomCode ?? '');
  const [timeMode, setTimeMode]     = useState<'fixed' | 'range'>('fixed');
  const [fixedSec, setFixedSec]     = useState('15');
  const [minSec, setMinSec]         = useState('10');
  const [maxSec, setMaxSec]         = useState('20');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [isPrivate, setIsPrivate]   = useState(false);
  const [publicRooms, setPublicRooms] = useState<Array<{ roomId: string; playerCount: number; maxPlayers: number }> | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [creating, setCreating]     = useState(false);
  const [copied, setCopied]         = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const isPremium = localStorage.getItem('bombparty-premium') === 'true';
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
    if (!name) { setActionError(t.enterNickname); return; }
    if (!socket) { setActionError(t.notConnected); return; }
    const pFixed = Number(fixedSec);
    const pMin   = Number(minSec);
    const pMax   = Number(maxSec);
    if (timeMode === 'fixed' && (!Number.isFinite(pFixed) || pFixed < 3 || pFixed > 60)) {
      setActionError(t.fixedTimeError); return;
    }
    if (timeMode === 'range' && (!Number.isFinite(pMin) || !Number.isFinite(pMax) || pMin < 3 || pMax > 60 || pMin > pMax)) {
      setActionError(t.rangeError); return;
    }
    setCreating(true);
    const timeout = setTimeout(() => {
      setCreating(false);
      setActionError(t.serverNoResponse);
    }, 8000);
    socket.emit(
      EVENTS.CREATE_ROOM,
      {
        nickname: name,
        avatarId,
        maxPlayers,
        isPrivate,
        turnTime: timeMode === 'fixed'
          ? { mode: 'fixed', fixedSeconds: pFixed }
          : { mode: 'range', minSeconds: pMin, maxSeconds: pMax },
      },
      (res: { ok?: boolean; error?: string }) => {
        clearTimeout(timeout);
        setCreating(false);
        if (res && !res.ok) setActionError(res.error ?? t.failedCreate);
        else trackEvent('room_created');
      },
    );
  };

  const handleJoin = () => {
    const code = roomCode.trim().toUpperCase();
    const name = nickname.trim();
    if (!code) { setActionError(t.enterRoomCode); return; }
    if (!name) { setActionError(t.enterNickname); return; }
    setActionError(null);
    clearLastError();
    socket?.emit(EVENTS.JOIN_ROOM, { roomId: code, nickname: name, avatarId },
      (res: { ok?: boolean; error?: string }) => {
        if (res && !res.ok) setActionError(res.error ?? t.failedJoin);
        else trackEvent('room_joined');
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
        if (res && !res.ok) setActionError(res.error ?? t.failedCreate);
      });
  };

  const handleBrowseRooms = async () => {
    if (publicRooms !== null) { setPublicRooms(null); return; }
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setPublicRooms(data.rooms ?? []);
    } catch {
      setPublicRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleCopyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareLink = () => {
    if (!roomId) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const handleJoinPublic = (id: string) => {
    const name = nickname.trim();
    if (!name) { setActionError(t.enterNickname); return; }
    setActionError(null);
    clearLastError();
    socket?.emit(EVENTS.JOIN_ROOM, { roomId: id, nickname: name, avatarId },
      (res: { ok?: boolean; error?: string }) => {
        if (res && !res.ok) setActionError(res.error ?? t.failedJoin);
      });
  };

  if (!connected) {
    return (
      <div className="bp-lobby">
        <p style={{ color: 'var(--text-2)' }}>{t.connectingToServer}</p>
      </div>
    );
  }

  /* ── Quick join via shared link ── */
  if (!roomId && initialRoomCode) {
    return (
      <div className="bp-lobby">
        <div className="bp-brand" style={{ textAlign: 'center' }}>
          <img src="/white-icon.png" alt="KelimeBombası" className="bp-brand-logo" />
          <h1>Kelime<span>Bombası</span></h1>
        </div>

        <div className="bp-card">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-3)' }}>
              {t.roomCodeLabel}
            </p>
            <div className="bp-code-display">{initialRoomCode}</div>
          </div>

          <div className="bp-field">
            <label>{t.nickname}</label>
            <input
              type="text"
              className="bp-input"
              placeholder={t.enterName}
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
          </div>

          <div className="bp-field">
            <label>{t.avatar}</label>
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

          <button
            type="button"
            className="bp-btn-primary"
            onClick={handleJoin}
          >
            {t.join}
          </button>
        </div>

        {err && <p className="bp-error">{err}</p>}
      </div>
    );
  }

  /* ── Pre-room: create or join ── */
  if (!roomId) {
    return (
      <div className="bp-lobby">

        {/* Brand */}
        <div className="bp-brand" style={{ textAlign: 'center' }}>
          <img src="/white-icon.png" alt="KelimeBombası" className="bp-brand-logo" />
          <h1>Kelime<span>Bombası</span></h1>
          <p>{t.tagline}</p>
          <div className="bp-brand-version">v{__APP_VERSION__}</div>
        </div>

        {/* Main card */}
        <div className="bp-card">

          {/* Nickname */}
          <div className="bp-field">
            <label>{t.nickname}</label>
            <input
              type="text"
              className="bp-input"
              placeholder={t.enterName}
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
            />
          </div>

          {/* Avatar */}
          <div className="bp-field">
            <label>{t.avatar}</label>
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
            <label>{t.turnDuration}</label>
            <div className="bp-tabs" style={{ marginBottom: 8 }}>
              <button
                type="button"
                className={`bp-tab ${timeMode === 'fixed' ? 'on' : 'off'}`}
                onClick={() => setTimeMode('fixed')}
              >{t.fixed}</button>
              <button
                type="button"
                className={`bp-tab ${timeMode === 'range' ? 'on' : 'off'}`}
                onClick={() => setTimeMode('range')}
              >{t.range}</button>
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
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{t.seconds}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: t.min, val: minSec, set: setMinSec },
                  { label: t.max, val: maxSec, set: setMaxSec },
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

          {/* Max players */}
          <div className="bp-field">
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t.maxPlayers}</span>
              <span style={{ fontWeight: 700, color: 'var(--yellow)' }}>{maxPlayers}</span>
            </label>
            <input
              type="range"
              min={2}
              max={12}
              value={maxPlayers}
              onChange={e => setMaxPlayers(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--yellow)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              <span>2</span><span>12</span>
            </div>
          </div>

          {/* Visibility */}
          <div className="bp-field">
            <label>{t.roomVisibility}</label>
            <div className="bp-tabs">
              <button
                type="button"
                className={`bp-tab ${!isPrivate ? 'on' : 'off'}`}
                onClick={() => setIsPrivate(false)}
              >{t.publicRoom}</button>
              <button
                type="button"
                className={`bp-tab ${isPrivate ? 'on' : 'off'}`}
                onClick={() => setIsPrivate(true)}
              >{t.privateRoom}</button>
            </div>
          </div>

          {/* Create */}
          <button
            type="button"
            className="bp-btn-primary"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? t.creating : t.startNewRoom}
          </button>

          <div className="bp-divider">{t.orJoin}</div>

          {/* Join */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="bp-input"
              placeholder={t.roomCode}
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
              {t.join}
            </button>
          </div>
        </div>

        {/* Public rooms browser */}
        <button
          type="button"
          className="bp-btn-secondary"
          onClick={handleBrowseRooms}
          disabled={loadingRooms}
          style={{ width: '100%', marginTop: 4 }}
        >
          {loadingRooms ? t.loadingRooms : t.browsePublicRooms}
        </button>

        {publicRooms !== null && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {publicRooms.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)', margin: 0 }}>{t.noPublicRooms}</p>
            ) : publicRooms.map(room => (
              <div key={room.roomId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', borderRadius: 8, padding: '8px 12px' }}>
                <div>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', letterSpacing: 2, fontSize: 15 }}>{room.roomId}</span>
                  <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-2)' }}>{t.playersSlashMax(room.playerCount, room.maxPlayers)}</span>
                </div>
                <button
                  type="button"
                  className="bp-btn-secondary"
                  onClick={() => handleJoinPublic(room.roomId)}
                  style={{ padding: '4px 14px', fontSize: 13 }}
                >{t.join}</button>
              </div>
            ))}
          </div>
        )}

        {/* Utility links */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {onOpenSettings && (
            <button type="button" className="bp-btn-secondary" onClick={onOpenSettings}>
              {t.settings}
            </button>
          )}
          {onOpenDictionary && (
            <button type="button" className="bp-btn-secondary" onClick={onOpenDictionary}>
              {t.dictionary}
            </button>
          )}
          <button
            type="button"
            className="bp-btn-secondary"
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            style={{ fontWeight: 700, letterSpacing: 1 }}
          >
            🌐 {lang === 'tr' ? 'EN' : 'TR'}
          </button>
        </div>

        {!isPremium && (
          <div style={{
            width: '100%', height: 90,
            border: '2px dashed var(--border)',
            borderRadius: 'var(--r-lg)',
            background: 'var(--surface-2)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 4,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-3)' }}>Reklam</span>
            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>Banner</span>
          </div>
        )}

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
          {t.roomCodeLabel}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div className="bp-code-display">{roomId}</div>
          <button
            type="button"
            className="bp-btn-secondary"
            onClick={handleCopyCode}
            style={{ fontSize: 12, padding: '4px 12px', whiteSpace: 'nowrap' }}
          >
            {copied ? t.copied : t.copyCode}
          </button>
          <button
            type="button"
            className="bp-btn-secondary"
            onClick={handleShareLink}
            style={{ fontSize: 12, padding: '4px 12px', whiteSpace: 'nowrap' }}
          >
            {linkCopied ? t.copied : t.shareLink}
          </button>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-2)' }}>
          {t.shareCode}
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
                {p.isHost && <span className="bp-host-tag">{t.host}</span>}
              </div>
            </div>
            <div className="bp-ready-indicator">
              <div className={`bp-ready-dot ${p.ready ? 'yes' : 'no'}`} />
              <span style={{ color: p.ready ? 'var(--green)' : 'var(--text-3)', fontSize: 11 }}>
                {p.ready ? t.ready : t.notReady}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button type="button" className="bp-btn-secondary" onClick={leaveRoom} style={{ fontSize: 12 }}>
          {t.returnToMenu}
        </button>

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
          {isReady ? t.readyCheck : t.readyUp}
        </button>

        {isHost && (
          <button
            type="button"
            className="bp-btn-primary"
            onClick={handleStart}
            disabled={!canStart}
            style={{ width: 'auto', paddingLeft: 28, paddingRight: 28 }}
          >
            {t.startGame}
          </button>
        )}
      </div>

      {err && <p className="bp-error">{err}</p>}
    </div>
  );
}
