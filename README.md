# BombParty

> Real-time multiplayer word game — type a valid Turkish word containing the given syllable before the bomb explodes.

[![CI](https://github.com/anilaltan/BombParty/actions/workflows/ci.yml/badge.svg)](https://github.com/anilaltan/BombParty/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org)

No sign-up required. Share a room code and play instantly in any browser.

---

## How it works

1. A host creates a room and shares the 6-character code.
2. Each turn, a random syllable appears (e.g. **KA**, **ŞAR**).
3. The active player must type a valid Turkish word containing that syllable before time runs out.
4. Fail → lose a life. Lose all lives → eliminated. Last player standing wins.

**Bonus:** Use all 29 letters of the Turkish alphabet across your submissions to earn an extra life.

---

## Features

- Real-time multiplayer via WebSockets (Socket.io)
- Server-authoritative timer with grace period
- Full Turkish alphabet support (İ, Ş, Ğ, Ü, Ö, Ç, ı…)
- Turkish dictionary with syllable-based word pool
- Live word attempt preview (see what others are typing)
- In-game chat
- Searchable dictionary browser
- Configurable turn duration and lives
- No accounts, no install — runs in any modern browser

---

## Tech stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS 4    |
| Backend   | Node.js 18+, Express, Socket.io               |
| Real-time | Socket.io (WebSocket + polling fallback)      |
| Data      | Turkish dictionary JSON, syllable pool        |
| Deploy    | Docker Compose (included)                     |

---

## Project structure

```
BombParty/
├── backend/
│   ├── src/
│   │   ├── dictionary/        # Loader, syllable pool, normalization
│   │   ├── validation/        # Word validation pipeline
│   │   ├── timer/             # Server-side turn timer
│   │   ├── profanity/         # Nickname/chat filter
│   │   └── socketManager.js   # All game logic and room state
│   ├── data/                  # dictionary.json, profanity list
│   └── scripts/               # Dictionary build utilities
└── frontend/
    └── src/
        ├── components/        # UI components
        ├── context/           # SocketContext, SettingsContext, I18nContext
        ├── lib/               # Socket constants, avatar data
        └── types/             # TypeScript game types
```

---

## Getting started

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Clone

```bash
git clone https://github.com/anilaltan/BombParty.git
cd BombParty
```

### 2. Backend

```bash
cd backend
npm install
npm start          # starts on port 3001
```

Environment variables (all optional):

| Variable           | Default | Description                   |
|--------------------|---------|-------------------------------|
| `PORT`             | `3001`  | HTTP/WebSocket port           |
| `CORS_ORIGIN`      | `*`     | Allowed frontend origin       |
| `TURN_DURATION_MS` | `15000` | Default turn duration (ms)    |
| `GRACE_MS`         | `200`   | Late-submission grace window  |

### 3. Frontend

```bash
cd frontend
npm install
npm run dev        # starts on port 3000, proxies /api to :3001
```

Open [http://localhost:3000](http://localhost:3000).

### Docker Compose (full stack)

```bash
docker-compose up --build
```

---

## Scripts

| Directory | Command                      | Description                        |
|-----------|------------------------------|------------------------------------|
| backend   | `npm start`                  | Start game server                  |
| backend   | `npm test`                   | Run backend tests                  |
| backend   | `npm run build-dictionary`   | Rebuild dictionary/syllable index  |
| frontend  | `npm run dev`                | Vite dev server                    |
| frontend  | `npm run build`              | Production build → `dist/`         |
| frontend  | `npm run lint`               | ESLint                             |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

[MIT](LICENSE)
