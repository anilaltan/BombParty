import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseDictionaryJson, loadAndParseFromFile } from './loader.js';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('parseDictionaryJson', () => {
  it('parses string array', () => {
    const out = parseDictionaryJson('["elma", "armut", "şeker"]');
    assert.deepStrictEqual(out, ['elma', 'armut', 'şeker']);
  });

  it('parses object with word keys', () => {
    const out = parseDictionaryJson('{"elma":1,"armut":2}');
    assert.ok(out.includes('elma') && out.includes('armut') && out.length === 2);
  });

  it('parses array of objects with word/kelime', () => {
    const out = parseDictionaryJson('[{"word":"test"},{"kelime":"kelime"}]');
    assert.deepStrictEqual(out, ['test', 'kelime']);
  });

  it('throws on invalid JSON', () => {
    assert.throws(() => parseDictionaryJson('not json'), /parse error/);
  });

  it('throws on unsupported type', () => {
    assert.throws(() => parseDictionaryJson('123'), /not supported/);
  });
});

describe('loadAndParseFromFile', () => {
  it('loads and parses sample dictionary', async () => {
    const path = join(__dirname, '../../data/sample-dictionary.json');
    const words = await loadAndParseFromFile(path);
    assert.ok(Array.isArray(words));
    assert.ok(words.length >= 10);
    assert.ok(words.some((w) => w.includes('ş') || w.includes('ç') || w.includes('ğ')));
  });
});
