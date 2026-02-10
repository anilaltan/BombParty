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
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
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
