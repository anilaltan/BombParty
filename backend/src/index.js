/**
 * Backend entry: load dictionary, then start HTTP + Socket.io server.
 */
import { createServer } from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { loadDictionary, size, getWordList } from './dictionary/index.js';
import { initSyllablePool, getSyllablePoolSize } from './dictionary/syllables.js';
import { attachSocketHandlers } from './socketManager.js';

const PORT = Number(process.env.PORT) || 3001;

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean);
// CORS for HTTP (and Socket.IO long-polling handshake): reflect origin when unset so LAN/dev works
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins?.length) {
    if (origin && allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins?.length ? allowedOrigins : true, // true = reflect request origin (required with credentials)
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

attachSocketHandlers(io);

async function main() {
  await loadDictionary();
  const wordCount = size();
  console.log(`Dictionary loaded: ${wordCount} words`);
  const envMin = Number(process.env.SYLLABLE_MIN_WORDS);
  const defaultMin = 20;
  const minWordCount =
    wordCount < 50
      ? 1
      : (envMin > 0 ? Math.min(envMin, wordCount) : defaultMin);
  initSyllablePool(getWordList(), minWordCount);
  const poolSize = getSyllablePoolSize();
  if (poolSize === 0) throw new Error('Syllable pool empty; need more dictionary words or lower SYLLABLE_MIN_WORDS');
  console.log(`Syllable pool: ${poolSize} valid syllables`);

  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
