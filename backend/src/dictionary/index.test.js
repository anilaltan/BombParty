import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { loadDictionary, has, size, buildFromSource } from './index.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../data');

describe('loadDictionary + has', () => {
  before(async () => {
    await buildFromSource(join(dataDir, 'sample-dictionary.json'), join(dataDir, 'dictionary.json'));
    await loadDictionary(join(dataDir, 'dictionary.json'));
  });

  it('loads and reports size', () => {
    assert.ok(size() >= 10);
  });

  it('has() returns true for known words', () => {
    assert.strictEqual(has('elma'), true);
    assert.strictEqual(has('şeker'), true);
    assert.strictEqual(has('İstanbul'), true); // normalized to istanbul
  });

  it('has() returns false for unknown words', () => {
    assert.strictEqual(has('xyzz'), false);
  });
});
