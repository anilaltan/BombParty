# BombParty — CLAUDE.md

## Project Overview

BombParty is a real-time multiplayer word game inspired by JackBox's Word Bomb. Players take turns typing Turkish words that contain a displayed syllable before a server-side timer expires. Failing to submit a valid word in time causes the "bomb" to explode, costing the player a life. Last player standing wins.

The game is Turkish-language first: all word validation, normalization, and the syllable pool are built around Turkish orthography (29-letter alphabet including ç, ğ, ı, İ, ö, ş, ü).

---

## Architecture

```
BombParty/
├── backend/     # Node.js/Express + Socket.io game server
└── frontend/    # React 19 + TypeScript SPA
```

### Backend

**Entry point:** `backend/src/index.js`

- Starts Express HTTP server (default port 3001)
- Mounts Socket.io on the same HTTP server
- Loads the dictionary into RAM on startup
- Exposes one REST endpoint: `GET /api/dictionary` (paginated, rate-limited)

**Game engine:** `backend/src/socketManager.js`

- All game state lives in two in-memory Maps:
  - `rooms: Map<roomId, GameRoom>` — full state for every active room
  - `socketToRoom: Map<socketId, roomId>` — fast reverse lookup
- Room capacity: 2–12 players per room, identified by a 6-char alphanumeric code
- Game status per room: `'waiting'` | `'playing'`

**Modules:**

| Path                             | Responsibility                                                     |
| -------------------------------- | ------------------------------------------------------------------ |
| `src/dictionary/index.js`        | Loads `data/dictionary.json` as a `Set<string>` for O(1) lookup    |
| `src/dictionary/syllables.js`    | Pre-computes valid syllable pool (2–3 chars, ≥20 word occurrences) |
| `src/dictionary/filter.js`       | Turkish text normalization (`normalizeTurkishLower`)               |
| `src/validation/validateWord.js` | Word validation: empty → syllable containment → dictionary → dupe  |
| `src/timer/turnTimer.js`         | Server-side countdown with a configurable grace period             |
| `src/profanity/index.js`         | Blacklist filter for nicknames and chat messages                   |

### Frontend

**Entry:** `frontend/src/main.tsx` → wraps app in `SocketProvider`

**Routing:** `frontend/src/App.tsx` — conditional rendering, no router library:

- `'main'` view → Lobby (default) or Game (if `gameState.status === 'playing'`)
- `'dictionary'` view → searchable word browser
- `'settings'` view → sound + language toggles

**State management — React Context API only (no Redux):**

| Context           | File                              | Persisted                            |
| ----------------- | --------------------------------- | ------------------------------------ |
| `SocketContext`   | `src/context/SocketContext.tsx`   | No — ephemeral socket state          |
| `SettingsContext` | `src/context/SettingsContext.tsx` | `localStorage['bombparty-settings']` |
| `I18nContext`     | `src/context/I18nContext.tsx`     | `localStorage['bombparty-lang']`     |

`SocketContext` is the single source of truth for game state. It subscribes to all Socket.io events and exposes state + the socket instance via the `useSocket()` hook.

---

## Tech Stack

| Layer              | Technology                | Version |
| ------------------ | ------------------------- | ------- |
| Frontend framework | React                     | 19.2.0  |
| Frontend language  | TypeScript                | ~5.9.3  |
| Frontend build     | Vite                      | 7.3.1   |
| Frontend styling   | Tailwind CSS              | 4.1.18  |
| Real-time (client) | socket.io-client          | 4.8.3   |
| Backend runtime    | Node.js                   | 18+     |
| Backend HTTP       | Express                   | 4.21.0  |
| Real-time (server) | Socket.io                 | 4.8.0   |
| Rate limiting      | express-rate-limit        | 8.4.1   |
| Backend language   | JavaScript (ESM)          | ES2024  |
| Backend tests      | Node.js built-in `--test` | —       |

Backend uses native ESM (`"type": "module"` in `package.json`). All imports use `.js` extensions even for source files.

---

## Frontend ↔ Backend Communication

### WebSocket (Socket.io) — all real-time game events

**Client → Server (emits):**

| Event         | Payload                                      |
| ------------- | -------------------------------------------- |
| `createRoom`  | `{ nickname, avatarId, timerConfig }`        |
| `joinRoom`    | `{ roomId, nickname, avatarId }`             |
| `setReady`    | —                                            |
| `startGame`   | host only                                    |
| `submitWord`  | `{ word }`, uses callback `(result) => void` |
| `wordAttempt` | `{ word }` — sent on every keystroke         |
| `chatMessage` | `{ text }`                                   |

**Server → Client (broadcasts to room):**

| Event          | Payload                                                                             |
| -------------- | ----------------------------------------------------------------------------------- |
| `roomJoined`   | `{ roomId, playerId }`                                                              |
| `playerList`   | `Player[]`                                                                          |
| `gameState`    | `{ status, currentSyllable, currentPlayerId, turnExpiresAt, usedWords, scores, … }` |
| `wordResult`   | `{ ok, error?, word }`                                                              |
| `bombExploded` | `{ playerId }`                                                                      |
| `gameEnd`      | `{ winner, players }`                                                               |
| `wordAttempt`  | `{ playerId, word }` (relayed to all other players)                                 |

All event names are defined once in the `EVENTS` object at the top of `socketManager.js` and must match the constants in `frontend/src/lib/socket.ts`.

### REST — Dictionary browser only

```
GET /api/dictionary?page=1&limit=200000
← { words: string[], total: number }
```

Used exclusively by `Dictionary.tsx` for the offline word browser. Vite dev server proxies `/api/*` to `localhost:3001`.

---

## Game Loop

1. Host emits `startGame`
2. Server initializes lives (default 3), resets scores, picks a syllable, starts timer
3. Server broadcasts `gameState` with `turnExpiresAt` (Unix ms timestamp)
4. Frontend counts down locally using `turnExpiresAt` (polls every 100ms)
5. Active player submits a word:
   - **Valid:** score++, track used letters, advance turn, new syllable, broadcast `gameState`
   - **Invalid:** callback with error reason, no state change
6. Timer expires → 200ms grace period → `handleBombExploded()`
   - Decrement lives for current player; eliminate if lives === 0
   - Broadcast `bombExploded` + new `gameState`
7. Repeat until one player remains → broadcast `gameEnd`

**Alphabet bonus:** The 29-letter Turkish alphabet is tracked per player. Using all 29 letters across submitted words grants +1 life and resets the tracker.

---

## Key Patterns

### Turkish text normalization — always use `normalizeTurkishLower`

All string comparisons involving user input or dictionary words must go through `normalizeTurkishLower` from `backend/src/dictionary/filter.js`. Never use `.toLowerCase()` directly on Turkish text — it mishandles `İ → i` and `I → ı`.

```js
import { normalizeTurkishLower } from "../dictionary/filter.js";
const normalized = normalizeTurkishLower(rawInput);
```

### Validation order in `validateWord`

Always check in this order: empty → syllable containment → dictionary lookup → duplicate. The first failing check returns immediately. Do not reorder.

### Socket event constants — single source of truth

Never hardcode event name strings. On the backend, use the `EVENTS` object in `socketManager.js`. On the frontend, use the constants exported from `frontend/src/lib/socket.ts`. If you add a new event, add it to both.

### Server-side timer authority

The server owns the timer. The frontend timer is display-only, driven by `turnExpiresAt` from `gameState`. Never trust a client-reported timestamp for game logic. The backend `turnTimer.js` grace period (200ms) allows late submissions that arrived before `onExpire` fires.

### Callback pattern for `submitWord`

`submitWord` uses a Socket.io acknowledgement callback, not a separate result event:

```ts
// Frontend
socket.emit('submitWord', { word }, (result: WordResult) => { … });
```

All other events are fire-and-forget; `submitWord` is the only one with a callback.

### Broadcast helpers

Always broadcast state via the two dedicated helpers in `socketManager.js`:

- `broadcastPlayerList(io, roomId)` — send player array to room
- `broadcastGameState(io, roomId)` — send full game state to room

Do not construct broadcast payloads inline outside these functions.

### CSS class naming

Custom component styles use the `.bp-*` prefix (`bp-button`, `bp-card`, `bp-input`, etc.) defined in `frontend/src/index.css`. Use these classes before reaching for arbitrary Tailwind utilities. Design tokens (colors, radii, spacing) are CSS custom properties on `:root`.

---

## How Claude Should Work

- Always read PROJECT_CONTEXT.md before making changes
- Never modify multiple layers (frontend + backend) unless explicitly asked
- Prefer minimal changes over large refactors
- When unsure, ask instead of guessing
- Always explain reasoning before making major changes

## Coding Rules & Constraints

### General

- No comments unless the _why_ is non-obvious. Never describe what the code does.
- No premature abstractions. Three similar lines is better than a new utility.
- No error handling for impossible cases. Trust internal invariants.
- No feature flags, backwards-compatibility shims, or dead code.

### Backend

- Backend is pure JavaScript ESM — no TypeScript. Use JSDoc `@typedef` for type documentation where helpful.
- All imports must use explicit `.js` file extensions (ESM requirement).
- Dictionary lookups must use the `Set`-based `has()` from `dictionary/index.js` — never re-read the file.
- Syllable pool is initialized once at startup via `initSyllablePool()`. Do not rebuild it per-request.
- Room/player mutation happens only inside `socketManager.js`. Dictionary, timer, and validation modules are pure functions with no side effects on game state.
- Do not store sensitive state on the socket object (`socket.data` is fine for roomId lookups, nothing else).

### Frontend

- All game state comes from `useSocket()`. Components must not maintain local copies of server state.
- `SocketContext` is the only place that calls `socket.on(...)` / `socket.off(...)`. Do not add socket listeners inside components.
- Use the `useT()` hook from `I18nContext` for all user-visible strings. No hardcoded English or Turkish strings in components.
- Audio is generated via the Web Audio API (`AudioContext`) inline in `Game.tsx`. Do not add audio files to the repo.
- The frontend timer (`turnExpiresAt`) updates every 100ms via `setInterval`. Do not use `setTimeout` chains for the display countdown.
- TypeScript: prefer `interface` over `type` for object shapes. All game types are in `frontend/src/types/game.ts`.

### Network / Security

- `CORS_ORIGIN` env var controls allowed origins. In production, set it explicitly — do not leave it reflective.
- `submitWord` input is capped at 64 characters server-side (`MAX_WORD_LENGTH`). Never trust client-supplied lengths.
- Nicknames are validated for length (≤20 chars) and profanity server-side before being stored.
- The `/api/dictionary` endpoint is rate-limited to 20 requests/minute per IP.

---

## Environment Variables

| Variable             | Default          | Where used                           |
| -------------------- | ---------------- | ------------------------------------ |
| `PORT`               | `3001`           | Backend HTTP/WS port                 |
| `CORS_ORIGIN`        | reflective       | Allowed frontend origins             |
| `TURN_DURATION_MS`   | `15000`          | Default turn duration                |
| `GRACE_MS`           | `200`            | Late-submission grace window         |
| `DEFAULT_LIVES`      | `3` (hardcoded)  | Starting lives per player            |
| `SYLLABLE_MIN_WORDS` | `20` (hardcoded) | Min occurrences for a valid syllable |
| `VITE_SOCKET_URL`    | auto-detect      | Backend URL for frontend             |

---

## Running the Project

```bash
# Backend (port 3001)
cd backend && npm install && npm start

# Frontend (port 3000, proxies /api to :3001)
cd frontend && npm install && npm run dev

# Backend tests
cd backend && npm test
```

Production build: `cd frontend && npm run build` → outputs to `frontend/dist/`.
