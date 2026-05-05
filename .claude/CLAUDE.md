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

## Performance Bottlenecks — BombParty

- Rendering: Context value recreated every render
  All three contexts create a new object literal on every render, causing every consumer to re-render even when values haven't changed.

SocketContext.tsx:118, I18nContext.tsx, SettingsContext.tsx:

// SocketContext.tsx — wrap in useMemo
const value: SocketContextValue = useMemo(() => ({
socket, connected, roomId, players, gameState,
liveAttempt, lastWordResult, lastError, gameEnd,
clearLastWordResult, clearLastError, clearGameEnd,
}), [socket, connected, roomId, players, gameState,
liveAttempt, lastWordResult, lastError, gameEnd,
clearLastWordResult, clearLastError, clearGameEnd]);

// I18nContext — same fix, dep: [lang]
const value = useMemo(() => ({ lang, setLang, t: translations[lang] }), [lang]);

// SettingsContext — same fix, dep: [settings.soundEnabled]
const value = useMemo(() => ({ soundEnabled: settings.soundEnabled, setSoundEnabled }), [settings.soundEnabled]);

- Rendering: PlayerCard memo is silently broken
  Game.tsx:120 — word change triggers WORD_ATTEMPT emit AND causes a re-render. Inside that render, usedWordsByPlayer[p.socketId] evaluates to a new array reference via the spread in broadcastGameState, breaking React.memo on every keystroke for all players.

The EMPTY_WORDS fallback helps only when the key is absent. Fix by memoizing derived card props:

const playerCardData = useMemo(() =>
players.map((p, i) => ({
pos: playerPositions[i],
active: p.socketId === gameState?.currentPlayerId,
liveWord: p.socketId === gameState?.currentPlayerId ? (liveAttempt?.word ?? '').toUpperCase() : '',
myWords: gameState?.usedWordsByPlayer?.[p.socketId] ?? EMPTY_WORDS,
})),
[players, gameState?.currentPlayerId, gameState?.usedWordsByPlayer, liveAttempt?.word, playerPositions]
);

- Socket: WORD_ATTEMPT sent on every keystroke — no debounce
  Game.tsx:118–121 fires on every word state change. At 5 chars/sec typing speed × rate limit of 20/sec, it saturates the allowed quota and the server re-broadcasts to all players on every keystroke.

// Add debounce — useDebouncedEffect or inline:
const debouncedWord = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
if (gameState?.status !== 'playing' || !isMyTurn) return;
if (debouncedWord.current) clearTimeout(debouncedWord.current);
debouncedWord.current = setTimeout(() => {
socket?.emit(EVENTS.WORD_ATTEMPT, { word });
}, 80); // 80ms — imperceptible lag, ~12 updates/sec max
return () => { if (debouncedWord.current) clearTimeout(debouncedWord.current); };
}, [gameState?.status, isMyTurn, socket, word]);

- Socket: WORD_ATTEMPT echoed back to sender
  socketManager.js:744 uses io.to(roomId) which includes the sender. The typing player already has the text locally — this wastes one emit per keystroke per player.

// Change from:
io.to(roomId).emit(EVENTS.WORD_ATTEMPT, { playerId: socket.id, word: attempt });
// To:
socket.to(roomId).emit(EVENTS.WORD_ATTEMPT, { playerId: socket.id, word: attempt });

- Network: Full usedWords array sent on every turn
  socketManager.js:186 — [...room.usedWords] converts the entire Set to an array on every broadcastGameState call. Late in a game with 200+ words, this is ~3–5 KB of redundant data every turn.

The frontend only needs to append one new word per turn. Add a dedicated delta event for successful submissions:

// In startNextTurn(), after updating state:
io.to(roomId).emit(EVENTS.WORD_ACCEPTED, { word: submittedWord, playerId: socket.id });
// Remove usedWords and usedWordsByPlayer from broadcastGameState payload
// Frontend accumulates them locally in SocketContext
This cuts the per-turn payload from ~3–5 KB down to ~200 bytes.

- Network: No caching headers on the dictionary endpoint
  index.js:55 — the dictionary never changes at runtime but is served without Cache-Control. Every Dictionary.tsx mount fetches it fresh.

res.set('Cache-Control', 'public, max-age=86400, immutable');
res.json({ words: slice, total: words.length });
Also tighten the limit cap on line 52 — allowing limit=200000 lets a single request bypass pagination:

const limit = Math.min(5000, Math.max(1, Number(req.query.limit) || API_PAGE_SIZE));

Priority Order

    Fix	Effort	Impact

1 Debounce WORD_ATTEMPT (Game.tsx:118) ~5 min Eliminates ~90% of keystroke traffic
2 socket.to() instead of io.to() for WORD_ATTEMPT echo (socketManager.js:744) 1 line Removes sender echo
3 useMemo on all three context values ~10 min Stops cascading re-renders
4 Fix PlayerCard memo breakage (Game.tsx:344) ~15 min Stops all-players re-render on each keystroke
5 Add Cache-Control to dictionary API (index.js:55) 1 line Eliminates repeat dictionary fetches
6 Delta usedWords event ~30 min Cuts per-turn payload 95%

## BombParty Market Analysis — Key Findings

### Market Size

- Global word game market: $9.4B (2025) → $20.1B by 2034 (8.8% CAGR)
- Turkey gaming market: $3.33B total, $427.5M mobile, ~22.8M mobile gamers
- Addressable Turkish word game segment: ~$18–25M/year (currently monetization-suppressed)
- Turkish-language TAM: ~80–90M speakers globally (Turkey + diaspora)

### Competitive Landscape

BombParty occupies a white space — no competitor currently holds the high-social + skill-based + Turkish-language quadrant:

- jklm.fun Bombparty (identical mechanic, English-only, stagnant) is the closest analog
- JackBox Word Bomb is English-only, paid, seasonal
- Wordle TR variants are solo, ad-supported, newspaper-owned, not developed as games
- Scrabble GO / Kelime Oyunu are turn-based, not real-time social

### Top 3 Target Segments

- Social Young Adults (18–28) — university students sharing room codes via WhatsApp/Discord; highest viral coefficient
- Classroom / Education (12–18 + teachers) — Turkish Language curriculum alignment; MEB/FATIH distribution channel; highest LTV
- Diaspora Turkish Speakers — 5–7M abroad with higher purchasing power; deep cultural motivation; no current product serving them

### Best Monetization Method

AdSense + one-time localStorage unlocks via Iyzico/Stripe. Turkey has low CPMs so ads alone won't scale until ~5k DAU — pairing with simple one-time purchases maximizes passive income with zero backend work.

AdSense Placement Strategy
Screen Format Count
Lobby (waiting room) Responsive banner 1
Game-end screen 300x250 rectangle 1
Dictionary browser 300x250 rectangle 1
Avoid:

During active gameplay — AdSense policy violation + destroys UX
Interstitials — don't work in SPA/Socket.io context, risk policy ban
Settings screen — near-zero traffic
More than 3 units total — triggers invalid traffic flags
Realistic Turkish Revenue
CPM range: $0.15–$0.50 (Turkey is bottom quartile globally for gaming).

DAU Monthly Revenue (USD)
1,000 $33–$110
5,000 $165–$550
20,000 $660–$2,200
Meaningful income only above 5k DAU.

How it works (same zero-backend pattern):

Payment link (Iyzico/Stripe) → success redirect with ?unlocked=premium → frontend writes localStorage['bombparty-premium'] = true → on load, check flag → hide ads + enable all premium features.

What's included:

No ads (conditionally render ad components only when flag is absent)
All 3 custom features (themes, avatars, extended timer)
Suggested price: 49–79 TRY (~$1.50–$2.40)

Turkey pricing sweet spot is under 100 TRY for impulse purchases. 49 TRY is low friction, 79 TRY still converts well for a "lifetime" unlock.

Frontend change is ~5 lines:

// In each ad component
const isPremium = localStorage.getItem('bombparty-premium') === 'true';
if (isPremium) return null;

// On app load, handle payment redirect
const params = new URLSearchParams(window.location.search);
if (params.get('unlocked') === 'premium') {
localStorage.setItem('bombparty-premium', 'true');
}
One caveat: localStorage is clearable. Some users will lose their unlock after clearing browser data. For a casual game at this price point, that's acceptable — if it bothers you, the fix is a simple redemption code system (no accounts needed), but that's scope creep.

This is strictly simpler than 3 separate purchases and easier to market: "Premium — 49 TRY, one-time, forever."

### Here are the 5 improvements ordered by impact ÷ effort:

1. Streak Counter (localStorage) — Effort: S | Impact: M
   Track consecutive wins per nickname in localStorage. Show "streak: 4" in the room view. Players protect streaks by returning to play, triggering goal-setting psychology. Ship this first — a few hours of work.

2. "Best Word" + One-Tap Share — Effort: S | Impact: M
   After game end, highlight the player's longest submitted word: "En uzun kelimeniz: ÇEKIRDEK (8 harf)". One-tap copies a WhatsApp/Twitter message with the room link. Turkish speakers are proud of language — this is culturally resonant and makes every session a distribution event.

3. Quick Rematch Button (5s countdown) — Effort: M | Impact: L
   On the end screen, a "Rematch (5s)" button auto-recreates the same room with the same players. The countdown creates FOMO. Players who just lost want immediate redemption, chaining 2–3 games instead of 1. Most powerful session-extension lever.

4. Difficulty Presets (Normal / Hard / Insane) — Effort: M | Impact: M
   Add a dropdown in "Create Room". Hard = shorter timer + 3-char syllables only. Insane = 5s turns. Display as a badge on the room code. Replayability variety — players who've mastered Normal feel drawn to escalate.

5. Power-Up Word Bonuses — Effort: L | Impact: S
   Vowel-heavy words get +2 points; consonant-heavy words reset alphabet tracker. Adds micro-goals per turn. Lowest ratio — skip for now, revisit as a later novelty update.

### 5 Key Market Insights

1. Word/puzzle games are Turkey's #1 genre. Kelime Gezmece has millions of downloads and holds sustained top rankings. This is a proven genre — no audience education needed.

2. Real-time multiplayer word games are an empty niche. Every Turkish word game (Wordle TR, Parolla, Kelime Gezmece) is solo or async. Wordzy Turkce has live multiplayer but imitates solo Wordle. BombParty's social group-pressure format has zero direct Turkish competitors.

3. Ad monetization is structurally correct for Turkey. Turkish Lira inflation makes IAP pricing unreliable. Top Turkish casual studios are 77% ad-driven — revenue settles in USD. AdMob rewarded video is the battle-tested path for a solo dev: no payment rails, no billing support.

4. Viral growth in this market is share-driven, not paid. The Turkish Wordle clone went viral purely through Twitter with no paid UA. BombParty has a stronger hook — players watch each other fail in real time, which is more shareable than a daily grid result.

5. Domestic market is underserved by local talent. Turkey is a $985M gaming market growing at 28%/year, yet 95% of Turkish studios export abroad. A locally-built, Turkish-language multiplayer game holds a trust and usability advantage no foreign competitor can replicate.

3 Opportunities to Exploit

1. Rewarded video ad for extra life. One ad unit, one weekend of work, USD-denominated income. Banner ad on the lobby screen for passive secondary revenue. No payment infrastructure, no billing support, no IAP price maintenance.

2. One-tap WhatsApp/Twitter share with room link. The game already has 6-character room codes. Add a "copy invite" button that pre-fills a message like "BombParty'ya katıl: bombparty.app/XYZABC". Every game session becomes a distribution event. Zero backend work required.

3. Surface the zero-registration flow explicitly. The game already supports guest nicknames — market this as the product's main pitch: "Arkadaşlarınla oyna, kayıt gerekmez." Target WhatsApp friend groups who play once a week, not daily-return users. Low infrastructure load, naturally low churn.

### Here's the SEO strategy from the specialist:

Keywords (10)
Keyword (TR) Competition Intent
Ücretsiz kelime oyunu çevrimiçi Medium Transactional
Arkadaşlarla kelime oyunu Low Transactional
Türkçe hece oyunu Low Informational
Kelime bomba oyunu Low Informational
Hızlı kelime oyunu Low Navigational
Tarayıcıda kelime oyunu Low Transactional
Çok oyunculu kelime oyunu Medium Informational
Türkçe beyin oyunu Medium Informational
Kelime oyunu High Navigational
Ücretsiz çok oyunculu tarayıcı oyunları High Transactional
Best bets: The low-competition "hece" and "bomba" keywords are unique to BombParty's mechanic — you can rank there fast without backlinks.

Page Title & Meta Description
Title (59 chars):

BombParty - Ücretsiz Çok Oyunculu Kelime Oyunu
Meta description (158 chars):

BombParty'de hızlı ve eğlenceli kelime oyununa katılın. Arkadaşlarınızla çevrimiçi oyna, heceleri tamamla ve bombanın patlamasını engelle. Ücretsiz!
5 Quick Wins (1 day)
OG/Twitter meta tags in frontend/index.html — makes shared room links look legit on social (huge for multiplayer game virality)

JSON-LD schema (@type: "WebApplication") in App.tsx — tells Google it's a free, playable Turkish-language app

XML sitemap at frontend/public/sitemap.xml — include / and /dictionary, submit to Google Search Console

Semantic H1 with keyword — add <h1 className="sr-only">BombParty - Ücretsiz Çok Oyunculu Kelime Oyunu</h1> to the lobby view

Static /rules or /about page in Turkish (300+ words) — the game UI is JavaScript-heavy and uncrawlable; this gives Google actual text content with your target keywords

The dictionary page (/dictionary) is a hidden SEO asset — it's a massive crawlable word list that will naturally rank for Turkish vocabulary queries over time. Make sure it's in the sitemap.
