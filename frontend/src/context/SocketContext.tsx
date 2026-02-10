import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { createSocket, EVENTS } from '../lib/socket';
import type { Socket } from 'socket.io-client';
import type { GameState, Player, WordResult, GameEndPayload } from '../types/game';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  roomId: string | null;
  players: Player[];
  gameState: GameState | null;
  lastWordResult: WordResult | null;
  lastError: string | null;
  gameEnd: GameEndPayload | null;
  clearLastWordResult: () => void;
  clearLastError: () => void;
  clearGameEnd: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

const initialGameState: GameState = {
  status: 'waiting',
  currentSyllable: null,
  usedWords: [],
  currentPlayerId: null,
  players: [],
};

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastWordResult, setLastWordResult] = useState<WordResult | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [gameEnd, setGameEnd] = useState<GameEndPayload | null>(null);

  useEffect(() => {
    const s = createSocket();
    setSocket(s);

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => {
      setConnected(false);
      setRoomId(null);
      setPlayers([]);
      setGameState(null);
    });

    s.on(EVENTS.ROOM_JOINED, (id: string) => {
      setRoomId(id);
      setGameState(initialGameState);
      setGameEnd(null);
    });

    s.on(EVENTS.PLAYER_LIST, (list: Player[]) => setPlayers(list));

    s.on(EVENTS.GAME_STATE, (payload: GameState) => setGameState(payload));

    s.on(EVENTS.WORD_RESULT, (result: WordResult) => setLastWordResult(result));

    s.on(EVENTS.BOMB_EXPLODED, () => {
      // State will update via next GAME_STATE
    });

    s.on(EVENTS.GAME_END, (payload: GameEndPayload) => {
      setGameEnd(payload);
      setGameState((prev) => (prev ? { ...prev, status: 'waiting' } : null));
    });

    s.on(EVENTS.ERROR, (msg: string) => setLastError(msg ?? 'Error'));

    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
    };
  }, []);

  const clearLastWordResult = useCallback(() => setLastWordResult(null), []);
  const clearLastError = useCallback(() => setLastError(null), []);
  const clearGameEnd = useCallback(() => setGameEnd(null), []);

  const value: SocketContextValue = {
    socket,
    connected,
    roomId,
    players,
    gameState,
    lastWordResult,
    lastError,
    gameEnd,
    clearLastWordResult,
    clearLastError,
    clearGameEnd,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
