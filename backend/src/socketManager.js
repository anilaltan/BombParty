/**
 * Socket.io connection and message handlers.
 * Room management: createRoom, joinRoom, player lists, ready status.
 * Game loop: startGame, turn management, game state.
 * @param {import('socket.io').Server} io
 */

import { getRandomSyllable, has as dictionaryHas } from './dictionary/index.js';
import { normalizeTurkishLower } from './dictionary/filter.js';
import { validateWord } from './validation/validateWord.js';
import { createTurnTimer } from './timer/turnTimer.js';
import { isProfane } from './profanity/index.js';

const ROOM_CODE_LENGTH = 6;
const GRACE_MS = Number(process.env.GRACE_MS) > 0 ? Number(process.env.GRACE_MS) : 200;
const DEFAULT_LIVES = 3;
const DEFAULT_TURN_DURATION_MS = Number(process.env.TURN_DURATION_MS) > 0 ? Number(process.env.TURN_DURATION_MS) : 15000;
const MIN_TURN_DURATION_MS = 3000;
const MAX_TURN_DURATION_MS = 60000;
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * @typedef {Object} GamePlayer
 * @property {string} socketId
 * @property {string} [nickname]
 * @property {string} [avatarId]
 * @property {boolean} ready
 * @property {number} [lives]
 * @property {number} [score]
 * @property {boolean} [isEliminated]
 * @property {boolean} [disconnected]
 *
 * @typedef {Object} GameRoom
 * @property {string} hostId
 * @property {GamePlayer[]} players
 * @property {'waiting'|'playing'} [status]
 * @property {string|null} [currentSyllable]
 * @property {string[]} [usedWords]
 * @property {number} [currentTurnIndex]
 * @type {Map<string, GameRoom>}
 */
const rooms = new Map();
/** @type {Map<string, string>} socketId -> roomId */
const socketToRoom = new Map();

const EVENTS = {
  CREATE_ROOM: 'createRoom',
  JOIN_ROOM: 'joinRoom',
  SET_READY: 'setReady',
  PLAYER_LIST: 'playerList',
  ROOM_JOINED: 'roomJoined',
  ROOM_LEFT: 'roomLeft',
  ERROR: 'error',
  START_GAME: 'startGame',
  GAME_STATE: 'gameState',
  SUBMIT_WORD: 'submitWord',
  WORD_ATTEMPT: 'wordAttempt',
  WORD_RESULT: 'wordResult',
  BOMB_EXPLODED: 'bombExploded',
  GAME_END: 'gameEnd',
};

function clampMs(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.max(MIN_TURN_DURATION_MS, Math.min(MAX_TURN_DURATION_MS, Math.round(num)));
}

function resolveTurnTimerConfig(rawConfig) {
  if (!rawConfig || typeof rawConfig !== 'object') {
    return { mode: 'fixed', fixedMs: DEFAULT_TURN_DURATION_MS, minMs: DEFAULT_TURN_DURATION_MS, maxMs: DEFAULT_TURN_DURATION_MS };
  }
  const mode = rawConfig.mode === 'range' ? 'range' : 'fixed';
  if (mode === 'range') {
    const minMs = clampMs(Number(rawConfig.minSeconds) * 1000);
    const maxMs = clampMs(Number(rawConfig.maxSeconds) * 1000);
    if (minMs == null || maxMs == null || minMs > maxMs) return null;
    return { mode, minMs, maxMs, fixedMs: minMs };
  }
  const fixedMs = clampMs(Number(rawConfig.fixedSeconds) * 1000);
  if (fixedMs == null) return null;
  return { mode, fixedMs, minMs: fixedMs, maxMs: fixedMs };
}

function getTurnDurationMs(room) {
  const cfg = room.turnTimerConfig ?? {
    mode: 'fixed',
    fixedMs: DEFAULT_TURN_DURATION_MS,
    minMs: DEFAULT_TURN_DURATION_MS,
    maxMs: DEFAULT_TURN_DURATION_MS,
  };
  if (cfg.mode === 'range') {
    const min = Number(cfg.minMs);
    const max = Number(cfg.maxMs);
    const span = max - min;
    if (span <= 0) return min;
    return min + Math.floor(Math.random() * (span + 1));
  }
  return Number(cfg.fixedMs) || DEFAULT_TURN_DURATION_MS;
}

function generateRoomId() {
  let id = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    id += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return rooms.has(id) ? generateRoomId() : id;
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} roomId
 */
function broadcastPlayerList(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const list = room.players
    .filter((p) => !p.disconnected)
    .map((p) => ({
      socketId: p.socketId,
      nickname: p.nickname,
      avatarId: p.avatarId,
      ready: p.ready,
      isHost: p.socketId === room.hostId,
      lives: p.lives ?? 0,
      score: p.score ?? 0,
      isEliminated: p.isEliminated ?? false,
    }));
  io.to(roomId).emit(EVENTS.PLAYER_LIST, list);
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} roomId
 */
function broadcastGameState(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const currentIndex = room.currentTurnIndex ?? 0;
  const currentPlayer = room.players[currentIndex];
  const activePlayers = room.players.filter((p) => !p.disconnected);
  const payload = {
    status: room.status,
    currentSyllable: room.currentSyllable ?? null,
    currentAttempt: room.currentAttempt ?? '',
    usedWords: room.usedWords ?? [],
    currentPlayerId: currentPlayer?.disconnected ? null : (currentPlayer?.socketId ?? null),
    turnDurationMs: room.currentTurnDurationMs ?? null,
    players: activePlayers.map((p) => ({
      socketId: p.socketId,
      nickname: p.nickname,
      avatarId: p.avatarId,
      ready: p.ready,
      isHost: p.socketId === room.hostId,
      lives: p.lives ?? 0,
      score: p.score ?? 0,
      isEliminated: p.isEliminated ?? false,
    })),
  };
  io.to(roomId).emit(EVENTS.GAME_STATE, payload);
}

/**
 * Get next non-eliminated, connected player index (circular). Returns -1 if none.
 * @param {GameRoom} room
 * @returns {number}
 */
function getNextTurnIndex(room) {
  const n = room.players.length;
  if (n === 0) return -1;
  const start = (room.currentTurnIndex + 1) % n;
  for (let i = 0; i < n; i++) {
    const idx = (start + i) % n;
    const p = room.players[idx];
    if (!p.disconnected && !p.isEliminated) return idx;
  }
  return -1;
}

/** @param {GameRoom} room @returns {number} First active player index or 0 */
function getFirstActiveTurnIndex(room) {
  for (let i = 0; i < room.players.length; i++) {
    if (!room.players[i].disconnected) return i;
  }
  return 0;
}

/**
 * Run bomb-exploded logic: decrement life, eliminate if 0, emit BOMB_EXPLODED; game end or start next turn.
 * @param {import('socket.io').Server} io
 * @param {string} roomId
 */
function handleBombExploded(io, roomId) {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'playing') return;
  if (room.turnTimer) {
    room.turnTimer.cancel();
    room.turnTimer = null;
  }
  const currentPlayer = room.players[room.currentTurnIndex];
  if (!currentPlayer) return;
  currentPlayer.lives = Math.max(0, (currentPlayer.lives ?? 0) - 1);
  if (currentPlayer.lives === 0) currentPlayer.isEliminated = true;
  broadcastPlayerList(io, roomId);
  const remaining = room.players.filter((p) => !p.isEliminated);
  io.to(roomId).emit(EVENTS.BOMB_EXPLODED, {});
  if (remaining.length <= 1) {
    const winner = remaining[0] ?? null;
    const finalScores = room.players.map((p) => ({
      socketId: p.socketId,
      nickname: p.nickname,
      avatarId: p.avatarId,
      score: p.score ?? 0,
      isEliminated: p.isEliminated,
    }));
    io.to(roomId).emit(EVENTS.GAME_END, { winner: winner?.socketId ?? null, players: finalScores });
    room.status = 'waiting';
    return;
  }
  const nextIdx = getNextTurnIndex(room);
  room.currentTurnIndex = nextIdx >= 0 ? nextIdx : 0;
  startNextTurn(io, roomId);
}

/**
 * Start next turn: assign new syllable, start server-side timer, broadcast.
 * @param {import('socket.io').Server} io
 * @param {string} roomId
 */
function startNextTurn(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  if (room.turnTimer) {
    room.turnTimer.cancel();
    room.turnTimer = null;
  }
  try {
    room.currentSyllable = getRandomSyllable();
  } catch {
    room.currentSyllable = null;
  }
  room.currentAttempt = '';
  room.currentTurnDurationMs = getTurnDurationMs(room);
  room.turnTimer = createTurnTimer({
    durationMs: room.currentTurnDurationMs,
    graceMs: GRACE_MS,
    onExpire: () => handleBombExploded(io, roomId),
  });
  room.turnTimer.start();
  broadcastGameState(io, roomId);
}

/**
 * Remove socket from its current room and clean up. Caller must still handle socket.leave(roomId).
 * @param {import('socket.io').Socket} socket
 * @returns {string | null} roomId left, or null
 */
function leaveCurrentRoom(socket) {
  const roomId = socketToRoom.get(socket.id);
  if (!roomId) return null;
  const room = rooms.get(roomId);
  if (!room) {
    socketToRoom.delete(socket.id);
    return null;
  }
  room.players = room.players.filter((p) => p.socketId !== socket.id);
  socketToRoom.delete(socket.id);
  if (room.players.length === 0) {
    rooms.delete(roomId);
    return roomId;
  }
  return roomId;
}

/**
 * Mark the socket's player as disconnected (rejoinable). Caller must socket.leave(roomId).
 * @param {import('socket.io').Socket} socket
 * @returns {string | null} roomId, or null
 */
function markPlayerDisconnected(socket) {
  const roomId = socketToRoom.get(socket.id);
  if (!roomId) return null;
  const room = rooms.get(roomId);
  if (!room) {
    socketToRoom.delete(socket.id);
    return null;
  }
  const player = room.players.find((p) => p.socketId === socket.id);
  if (player) {
    player.disconnected = true;
    if (room.hostId === socket.id) {
      const nextHost = room.players.find((p) => p.socketId !== socket.id && !p.disconnected);
      room.hostId = nextHost?.socketId ?? room.hostId;
    }
  }
  socketToRoom.delete(socket.id);
  return roomId;
}

/** Game events: startGame (host), submitWord { word }, bombExploded; server emits gameState, wordResult, gameEnd */
export { EVENTS };

export function attachSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`client connected: ${socket.id}`);

    socket.on(EVENTS.CREATE_ROOM, (payload, cb) => {
      const nickname = typeof payload?.nickname === 'string' ? payload.nickname.trim() : undefined;
      const avatarId = typeof payload?.avatarId === 'string' ? payload.avatarId.trim() || undefined : undefined;
      const turnTimerConfig = resolveTurnTimerConfig(payload?.turnTime);
      if (!nickname) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Nickname required' });
        return;
      }
      if (!turnTimerConfig) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Invalid turn time settings' });
        return;
      }
      if (isProfane(nickname)) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Nickname not allowed' });
        return;
      }
      const prevRoomId = leaveCurrentRoom(socket);
      if (prevRoomId) {
        socket.leave(prevRoomId);
        broadcastPlayerList(io, prevRoomId);
      }

      const newId = generateRoomId();
      socket.join(newId);
      const player = {
        socketId: socket.id,
        nickname: nickname ?? undefined,
        avatarId: avatarId ?? undefined,
        ready: false,
        lives: 0,
        score: 0,
        isEliminated: false,
      };
      rooms.set(newId, {
        hostId: socket.id,
        players: [player],
        turnTimerConfig,
        currentTurnDurationMs: turnTimerConfig.fixedMs,
        status: 'waiting',
        currentSyllable: null,
        currentAttempt: '',
        usedWords: [],
        currentTurnIndex: 0,
      });
      socketToRoom.set(socket.id, newId);

      if (typeof cb === 'function') cb({ ok: true, roomId: newId });
      socket.emit(EVENTS.ROOM_JOINED, newId);
      broadcastPlayerList(io, newId);
    });

    socket.on(EVENTS.JOIN_ROOM, (payload, cb) => {
      const roomId = payload?.roomId?.trim?.();
      const nickname = typeof payload?.nickname === 'string' ? payload.nickname.trim() : undefined;
      const avatarId = typeof payload?.avatarId === 'string' ? payload.avatarId.trim() || undefined : undefined;
      if (!roomId) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Room ID required' });
        return;
      }
      if (!nickname) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Nickname required' });
        return;
      }
      if (isProfane(nickname)) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Nickname not allowed' });
        return;
      }
      const room = rooms.get(roomId);
      if (!room) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Room not found' });
        return;
      }
      const prevRoomId = leaveCurrentRoom(socket);
      if (prevRoomId) {
        socket.leave(prevRoomId);
        broadcastPlayerList(io, prevRoomId);
      }

      const disconnectedSlot = room.players.find(
        (p) => p.disconnected && (p.nickname || '').toLowerCase() === (nickname || '').toLowerCase()
      );
      if (disconnectedSlot) {
        disconnectedSlot.socketId = socket.id;
        disconnectedSlot.disconnected = false;
        disconnectedSlot.avatarId = avatarId ?? disconnectedSlot.avatarId;
        socketToRoom.set(socket.id, roomId);
        socket.join(roomId);
        if (typeof cb === 'function') cb({ ok: true, roomId, rejoin: true });
        socket.emit(EVENTS.ROOM_JOINED, roomId);
        broadcastPlayerList(io, roomId);
        if (room.status === 'playing') broadcastGameState(io, roomId);
        return;
      }

      const alreadyInRoom = room.players.some(
        (p) => !p.disconnected && (p.nickname || '').toLowerCase() === (nickname || '').toLowerCase()
      );
      if (alreadyInRoom) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Nickname already in use' });
        return;
      }

      socket.join(roomId);
      room.players.push({
        socketId: socket.id,
        nickname: nickname ?? undefined,
        avatarId: avatarId ?? undefined,
        ready: false,
        lives: 0,
        score: 0,
        isEliminated: false,
      });
      socketToRoom.set(socket.id, roomId);

      if (typeof cb === 'function') cb({ ok: true, roomId });
      socket.emit(EVENTS.ROOM_JOINED, roomId);
      broadcastPlayerList(io, roomId);
    });

    socket.on(EVENTS.SET_READY, (payload, cb) => {
      const roomId = socketToRoom.get(socket.id);
      if (!roomId) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Not in a room' });
        return;
      }
      const room = rooms.get(roomId);
      if (!room) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Room not found' });
        return;
      }
      const player = room.players.find((p) => p.socketId === socket.id);
      if (player) {
        player.ready = payload === true || payload?.ready === true;
        broadcastPlayerList(io, roomId);
      }
      if (typeof cb === 'function') cb({ ok: true });
    });

    socket.on(EVENTS.START_GAME, (payload, cb) => {
      const roomId = socketToRoom.get(socket.id);
      if (!roomId) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Not in a room' });
        return;
      }
      const room = rooms.get(roomId);
      if (!room) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Room not found' });
        return;
      }
      if (room.status === 'playing') {
        if (typeof cb === 'function') cb({ ok: false, error: 'Game already started' });
        return;
      }
      if (room.hostId !== socket.id) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Only host can start the game' });
        return;
      }
      const active = room.players.filter((p) => !p.disconnected);
      const allReady = active.length >= 2 && active.every((p) => p.ready);
      if (!allReady) {
        if (typeof cb === 'function') cb({ ok: false, error: 'All players must be ready (min 2 players)' });
        return;
      }
      const lives = Number(process.env.DEFAULT_LIVES) || DEFAULT_LIVES;
      room.players.forEach((p) => {
        p.lives = lives;
        p.score = 0;
        p.isEliminated = false;
      });
      room.status = 'playing';
      room.currentTurnIndex = getFirstActiveTurnIndex(room);
      room.currentAttempt = '';
      room.usedWords = [];
      room.currentTurnDurationMs = getTurnDurationMs(room);
      try {
        room.currentSyllable = getRandomSyllable();
      } catch (e) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Syllable pool not ready' });
        return;
      }
      if (typeof cb === 'function') cb({ ok: true });
      broadcastPlayerList(io, roomId);
      broadcastGameState(io, roomId);
      room.turnTimer = createTurnTimer({
        durationMs: room.currentTurnDurationMs,
        graceMs: GRACE_MS,
        onExpire: () => handleBombExploded(io, roomId),
      });
      room.turnTimer.start();
    });

    socket.on(EVENTS.SUBMIT_WORD, (payload, cb) => {
      const roomId = socketToRoom.get(socket.id);
      const reply = (result) => {
        if (typeof cb === 'function') cb(result);
        socket.emit(EVENTS.WORD_RESULT, result);
      };
      if (!roomId) {
        reply({ ok: false, error: 'Not in a room' });
        return;
      }
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') {
        reply({ ok: false, error: 'Game not in progress' });
        return;
      }
      const currentPlayer = room.players[room.currentTurnIndex];
      if (!currentPlayer || currentPlayer.socketId !== socket.id) {
        reply({ ok: false, error: 'Not your turn' });
        return;
      }
      const raw = typeof payload?.word === 'string' ? payload.word.trim() : '';
      const syllable = room.currentSyllable ?? '';
      const result = validateWord(raw, syllable, room.usedWords ?? [], { has: dictionaryHas });
      if (!result.valid) {
        reply({ ok: false, error: result.reason });
        return;
      }
      const word = normalizeTurkishLower(raw);
      const inGrace =
        room.turnTimer?.getExpiredAt() != null &&
        Date.now() - room.turnTimer.getExpiredAt() <= GRACE_MS;
      if (inGrace) room.turnTimer?.cancelGrace();
      const used = room.usedWords ?? [];
      used.push(word);
      room.usedWords = used;
      room.currentAttempt = '';
      currentPlayer.score = (currentPlayer.score ?? 0) + 1;
      const nextIdx = getNextTurnIndex(room);
      room.currentTurnIndex = nextIdx >= 0 ? nextIdx : room.currentTurnIndex;
      if (room.turnTimer) {
        room.turnTimer.cancel();
        room.turnTimer = null;
      }
      broadcastPlayerList(io, roomId);
      reply({ ok: true });
      startNextTurn(io, roomId);
    });

    socket.on(EVENTS.WORD_ATTEMPT, (payload, cb) => {
      const roomId = socketToRoom.get(socket.id);
      if (!roomId) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Not in a room' });
        return;
      }
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') {
        if (typeof cb === 'function') cb({ ok: false, error: 'Game not in progress' });
        return;
      }
      const currentPlayer = room.players[room.currentTurnIndex];
      if (!currentPlayer || currentPlayer.socketId !== socket.id) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Not your turn' });
        return;
      }
      const attempt = typeof payload?.word === 'string' ? payload.word.slice(0, 64) : '';
      room.currentAttempt = attempt;
      io.to(roomId).emit(EVENTS.WORD_ATTEMPT, {
        playerId: socket.id,
        word: attempt,
      });
      if (typeof cb === 'function') cb({ ok: true });
    });

    socket.on(EVENTS.BOMB_EXPLODED, (payload, cb) => {
      if (typeof cb === 'function') cb({ ok: false, error: 'Bomb is server-authoritative' });
    });

    socket.on('disconnect', (reason) => {
      console.log(`client disconnected: ${socket.id} (${reason})`);
      const roomId = markPlayerDisconnected(socket);
      if (roomId) {
        socket.leave(roomId);
        const room = rooms.get(roomId);
        if (room) {
          broadcastPlayerList(io, roomId);
          if (room.status === 'playing') broadcastGameState(io, roomId);
        }
      }
    });

    socket.on('message', (payload, cb) => {
      const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
      if (text && isProfane(text)) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Message not allowed' });
        return;
      }
      if (typeof cb === 'function') cb({ ok: true, echo: payload });
    });
  });
}
