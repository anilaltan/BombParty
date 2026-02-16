export interface Player {
  socketId: string;
  nickname?: string;
  avatarId?: string;
  ready: boolean;
  isHost: boolean;
  lives: number;
  score: number;
  isEliminated: boolean;
  wordsFound?: number;
  usedLetters?: string[];
}

export interface GameState {
  status: 'waiting' | 'playing';
  currentSyllable: string | null;
  currentAttempt?: string;
  usedWords: string[];
  currentPlayerId: string | null;
  turnDurationMs?: number;
  players: Player[];
}

export interface WordResult {
  ok: boolean;
  error?: string;
  word?: string;
}

export interface GameEndPayload {
  winner: string | null;
  players: Array<{ socketId: string; nickname?: string; avatarId?: string; score: number; isEliminated: boolean }>;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  type: 'chat' | 'system';
}
