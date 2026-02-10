export interface Player {
  socketId: string;
  nickname?: string;
  avatarId?: string;
  ready: boolean;
  isHost: boolean;
  lives: number;
  score: number;
  isEliminated: boolean;
}

export interface GameState {
  status: 'waiting' | 'playing';
  currentSyllable: string | null;
  usedWords: string[];
  currentPlayerId: string | null;
  players: Player[];
}

export interface WordResult {
  ok: boolean;
  error?: string;
}

export interface GameEndPayload {
  winner: string | null;
  players: Array<{ socketId: string; nickname?: string; avatarId?: string; score: number; isEliminated: boolean }>;
}
