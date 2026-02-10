#!/usr/bin/env node
/**
 * Build optimized dictionary.json from a raw TDK source.
 * Usage: node src/dictionary/build.js [path-to-raw-dictionary.json]
 * Default source: data/sample-dictionary.json (for dev); override with env DICTIONARY_SOURCE or arg.
 */
import { buildFromSource } from './index.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../data');
const defaultSource = join(dataDir, 'sample-dictionary.json');
const defaultOut = join(dataDir, 'dictionary.json');

const source = process.argv[2] || process.env.DICTIONARY_SOURCE || defaultSource;

try {
  const { count, path: outPath } = await buildFromSource(source, defaultOut);
  console.log(`Built dictionary: ${count} words -> ${outPath}`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
