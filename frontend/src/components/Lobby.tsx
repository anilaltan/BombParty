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
    if (!name) {
      setActionError('Please enter a nickname');
      return;
    }
    if (!socket) {
      setActionError('Not connected');
      return;
    }
    const parsedFixed = Number(fixedSeconds);
    const parsedMin = Number(minSeconds);
    const parsedMax = Number(maxSeconds);
    if (timeMode === 'fixed' && (!Number.isFinite(parsedFixed) || parsedFixed < 3 || parsedFixed > 60)) {
      setActionError('Sabit sure 3-60 saniye olmali');
      return;
    }
    if (
      timeMode === 'range' &&
      (!Number.isFinite(parsedMin) ||
        !Number.isFinite(parsedMax) ||
        parsedMin < 3 ||
        parsedMax > 60 ||
        parsedMin > parsedMax)
    ) {
      setActionError('Aralik 3-60 olmali ve min <= max olmali');
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
    if (!code) {
      setActionError('Enter room code');
      return;
    }
    const name = nickname.trim();
    if (!name) {
      setActionError('Please enter a nickname');
      return;
    }
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
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <p className="text-amber-400">Connecting to server...</p>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 gap-4">
        <h1 className="text-3xl font-bold">Word Bomb</h1>
        <input
          type="text"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white w-64"
        />
        <div className="flex flex-col items-center gap-1">
          <span className="text-gray-400 text-sm">Avatar</span>
          <div className="flex gap-2 flex-wrap justify-center max-w-[16rem]">
            {AVATAR_OPTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedAvatarId(a.id)}
                className={`w-10 h-10 rounded-full text-xl flex items-center justify-center border-2 transition ${
                  selectedAvatarId === a.id ? 'border-emerald-500 bg-gray-700' : 'border-gray-600 hover:border-gray-500'
                }`}
                title={a.id}
              >
                {a.emoji}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-center">
          <div className="w-64 rounded border border-gray-700 bg-gray-800/50 p-3 text-sm space-y-2">
            <p className="text-gray-300 font-medium">Tur suresi</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTimeMode('fixed')}
                className={`flex-1 rounded px-2 py-1 ${
                  timeMode === 'fixed' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                Sabit
              </button>
              <button
                type="button"
                onClick={() => setTimeMode('range')}
                className={`flex-1 rounded px-2 py-1 ${
                  timeMode === 'range' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                Aralik
              </button>
            </div>
            {timeMode === 'fixed' ? (
              <label className="flex items-center justify-between gap-2">
                <span className="text-gray-400">Saniye</span>
                <input
                  type="number"
                  min={3}
                  max={60}
                  value={fixedSeconds}
                  onChange={(e) => setFixedSeconds(e.target.value)}
                  className="w-24 px-2 py-1 rounded bg-gray-900 border border-gray-600 text-white"
                />
              </label>
            ) : (
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-between gap-2">
                  <span className="text-gray-400">Min</span>
                  <input
                    type="number"
                    min={3}
                    max={60}
                    value={minSeconds}
                    onChange={(e) => setMinSeconds(e.target.value)}
                    className="w-20 px-2 py-1 rounded bg-gray-900 border border-gray-600 text-white"
                  />
                </label>
                <label className="flex-1 flex items-center justify-between gap-2">
                  <span className="text-gray-400">Max</span>
                  <input
                    type="number"
                    min={3}
                    max={60}
                    value={maxSeconds}
                    onChange={(e) => setMaxSeconds(e.target.value)}
                    className="w-20 px-2 py-1 rounded bg-gray-900 border border-gray-600 text-white"
                  />
                </label>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleCreateRoom}
            disabled={creating}
            className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating…' : 'Create Room'}
          </button>
        </div>
        <p className="text-gray-400 text-sm">Join or rejoin with room code</p>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white w-32 uppercase"
          />
          <button
            type="button"
            onClick={handleJoinRoom}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500"
          >
            Join
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
            >
              Ayarlar
            </button>
          )}
          {onOpenDictionary && (
            <button
              type="button"
              onClick={onOpenDictionary}
              className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
            >
              Sözlük
            </button>
          )}
        </div>
        {err && <p className="text-red-400 text-sm">{err}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 gap-4">
      <h1 className="text-2xl font-bold">Room {roomId}</h1>
      <p className="text-gray-400 text-sm">Share this code to invite others.</p>
      <ul className="list-none space-y-1 w-64">
        {players.map((p: Player) => (
          <li key={p.socketId} className="flex justify-between items-center py-1 border-b border-gray-700 gap-2">
            <span className="flex items-center gap-2">
              <span className="text-lg">{getAvatarEmoji(p.avatarId)}</span>
              {p.nickname || p.socketId.slice(0, 6)}
            </span>
            <span className="text-sm text-gray-400">
              {p.isHost && 'Host'}
              {p.ready && ' · Ready'}
            </span>
          </li>
        ))}
      </ul>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isReady}
          onChange={(e) => handleSetReady(e.target.checked)}
          className="rounded"
        />
        Ready
      </label>
      {isHost && (
        <button
          onClick={handleStartGame}
          disabled={!canStart}
          className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Game
        </button>
      )}
      {err && <p className="text-red-400 text-sm">{err}</p>}
    </div>
  );
}
