/**
 * Backend entry: load dictionary, then start HTTP + Socket.io server.
 */
import { createServer } from 'http';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { loadDictionary, size, getWordList } from './dictionary/index.js';

const API_PAGE_SIZE = 2000;
import { initSyllablePool, getSyllablePoolSize } from './dictionary/syllables.js';
import { attachSocketHandlers, shutdown, getPublicRooms } from './socketManager.js';

const PORT = Number(process.env.PORT) || 3001;

const app = express();

const configuredOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean);
if (!configuredOrigins?.length) {
  console.warn('CORS_ORIGIN not set — allowing localhost only. Set CORS_ORIGIN before public deployment.');
}
// Reflective origin + credentials=true is a security vulnerability: any site could
// make credentialed requests on a visitor's behalf. Use an explicit allowlist always.
const allowedOrigins = configuredOrigins?.length
  ? configuredOrigins
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const dictLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek, lütfen yavaşlayın.' },
});

app.get('/api/rooms', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ rooms: getPublicRooms() });
});

app.get('/api/dictionary/meta', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ total: size() });
});

app.get('/api/dictionary', dictLimiter, (req, res) => {
  try {
    const words = getWordList();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100000, Math.max(1, Number(req.query.limit) || API_PAGE_SIZE));
    const start = (page - 1) * limit;
    const slice = words.slice(start, start + limit);
    res.set('Cache-Control', 'public, max-age=86400, must-revalidate');
    res.json({ words: slice, total: words.length });
  } catch (e) {
    res.status(500).json({ error: 'Sözlük yüklenmedi' });
  }
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
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
  if (poolSize === 0) throw new Error('Syllable pool is empty. Lower SYLLABLE_MIN_WORDS env var or provide a larger dictionary.');
  console.log(`Syllable pool: ${poolSize} valid syllables`);

  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

function gracefulShutdown(signal) {
  console.log(`${signal} received, shutting down…`);
  shutdown();
  io.close();
  httpServer.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}

process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGINT',  () => gracefulShutdown('SIGINT'));
