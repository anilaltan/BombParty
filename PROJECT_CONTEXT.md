## BombParty — Architecture Reference

### Structure

```
BombParty/
├── backend/src/
│   ├── index.js             # Express + Socket.io server, /api/dictionary endpoint
│   ├── socketManager.js     # All game logic: rooms, turns, scoring, broadcasts
│   ├── dictionary/          # Word Set (O(1) lookup), syllable pool, Turkish normalization
│   ├── validation/          # validateWord() — pure function, no side effects
│   ├── timer/               # createTurnTimer() — server-side countdown + grace period
│   └── profanity/           # isProfane() — nickname + chat filter
└── frontend/src/
    ├── App.tsx              # View router ('main' | 'dictionary' | 'settings')
    ├── context/
    │   ├── SocketContext.tsx # Single source of game state; all socket.on() calls live here
    │   ├── SettingsContext.tsx
    │   └── I18nContext.tsx
    ├── components/
    │   ├── Game.tsx         # Arena, bomb ring, player cards, word input, chat, audio
    │   └── Lobby.tsx        # Room create/join, ready screen
    ├── lib/socket.ts        # Socket.io client init + event name constants
    └── types/game.ts        # TypeScript interfaces (Player, GameState, WordResult, …)
```

### Stack

- **Frontend:** React 19 + TypeScript, Vite 7, Tailwind CSS 4, socket.io-client 4
- **Backend:** Node.js 18+ ESM, Express 4, Socket.io 4, no database (all in-memory)

### Communication

Two channels:

**WebSocket (Socket.io)** — all real-time game events

```
Client → Server              Server → Client (broadcast to room)
──────────────               ────────────────────────────────────
createRoom                   roomJoined
joinRoom                     playerList
setReady                     gameState  ← authoritative state (includes turnExpiresAt)
startGame                    wordResult
submitWord (+ callback)      bombExploded
wordAttempt (every keystroke)gameEnd
chatMessage                  wordAttempt (relayed)
```

**HTTP REST** — dictionary browser only

```
GET /api/dictionary?page=1&limit=200000  →  { words: string[], total: number }
```

### State ownership

- **Server:** owns all game state in two Maps — `rooms: Map<roomId, GameRoom>`, `socketToRoom: Map<socketId, roomId>`
- **Frontend:** `SocketContext` is the only state store for game data; components read via `useSocket()`
- **Timer:** server-authoritative; frontend counts down from `turnExpiresAt` (display only)

### Key invariants

1. All Turkish string comparisons use `normalizeTurkishLower()` — never raw `.toLowerCase()`
2. `validateWord()` checks in fixed order: empty → syllable containment → dictionary → duplicate
3. Event name strings live in `EVENTS` (backend) and `socket.ts` (frontend) — never hardcoded
4. `submitWord` is the only socket event that uses a callback; all others are fire-and-forget
5. Socket listeners belong only in `SocketContext` — never inside components
6. State broadcasts always go through `broadcastGameState()` / `broadcastPlayerList()` helpers

## Current State

- Multiplayer game working
- i18n implemented (TR/EN)
- Socket system stable

## Known Issues

-

## Next Goals

-
