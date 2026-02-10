# BombParty (Word Bomb)

Real-time multiplayer browser game: type Turkish words containing the given syllable before the bomb explodes. No sign-up, instant play.

## What it is

- **Syllable rounds**: Each turn you get a random syllable (e.g. "KA", "ŞAR"); you must type a valid Turkish word that contains it.
- **Timer**: A countdown runs per turn; submit a valid word in time or lose a life.
- **Rooms**: Create or join rooms, play with friends or random players.
- **Turkish-first**: Full support for İ, Ş, Ğ, Ü, Ö, Ç and a Turkish dictionary.

## Tech stack

| Layer    | Stack |
|----------|--------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Socket.io-client |
| Backend  | Node.js, Express, Socket.io |
| Data     | Turkish dictionary (syllable-based), profanity filter |

## Project structure

```
BombParty/
├── backend/          # Game server, validation, timer, dictionary
│   ├── src/
│   │   ├── dictionary/   # Loader, syllables, word validation
│   │   ├── socketManager.js
│   │   ├── timer/
│   │   └── validation/
│   ├── data/         # dictionary.json, profanity list
│   └── scripts/      # fetch-kelimetre, kelime-botu
├── frontend/         # React + Vite SPA
│   └── src/
│       ├── components/
│       ├── context/  # SocketContext
│       └── lib/     # socket, avatars, types
├── .env.example
└── README.md
```

## Prerequisites

- Node.js 18+
- (Optional) Docker Compose for running backend in a container

## Setup

### 1. Clone and install

```bash
git clone https://github.com/anilaltan/BombParty.git
cd BombParty
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # edit if needed
npm install
npm run build-dictionary   # build syllable index from dictionary
npm start                  # default port 3000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_SOCKET_URL if backend is not localhost:3000
npm install
npm run dev
```

Open the URL shown by Vite (e.g. http://localhost:5173).

### Env (summary)

- **Backend**: optional `PORT`, other config as in `.env.example`.
- **Frontend**: `VITE_SOCKET_URL` — Socket.io server URL (default assumes same host, different port).

## Scripts

| Where     | Command | Description |
|----------|---------|-------------|
| Backend  | `npm start` | Start game server |
| Backend  | `npm run build-dictionary` | Rebuild dictionary/syllables |
| Backend  | `npm run fetch-kelimetre` | Fetch words from Kelimetre |
| Backend  | `npm test` | Run backend tests |
| Frontend | `npm run dev` | Vite dev server |
| Frontend | `npm run build` | Production build |

## License

MIT.
