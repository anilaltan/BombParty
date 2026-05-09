import { io, Socket } from 'socket.io-client';

export const EVENTS = {
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
  CHAT_MESSAGE: 'chatMessage',
} as const;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  (typeof window !== 'undefined'
    ? window.location.hostname === 'localhost'
      ? 'http://localhost:3001'
      : window.location.origin
    : 'http://localhost:3001');

export function createSocket(): Socket {
  return io(SOCKET_URL, {
    autoConnect: true,
    withCredentials: true,
  });
}
