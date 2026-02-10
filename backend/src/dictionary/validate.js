/**
 * Validate loaded dictionary: Turkish character coverage and integrity.
 * Run after loadDictionary() or as standalone with a path to dictionary.json.
 */
import { readFile } from 'fs/promises';
import { loadDictionary, has, size } from './index.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = join(__dirname, '../../data/dictionary.json');

const TURKISH_SAMPLES = [
  'şeker', 'çikolata', 'güneş', 'kapı', 'ışık', 'müzik', 'öğrenci', 'üç', 'ıslak', 'kağıt', 'istanbul'
];

/**
 * Run integrity checks on the loaded dictionary.
 * @param {string} [dictPath]
 * @returns {Promise<{ ok: boolean, count: number, checks: Record<string, boolean>, errors: string[] }>}
 */
export async function validateDictionary(dictPath = DEFAULT_PATH) {
  const errors = [];
  const checks = {};

  await loadDictionary(dictPath);
  const count = size();
  checks.load = count > 0;
  if (!checks.load) errors.push('Dictionary empty or failed to load');

  for (const word of TURKISH_SAMPLES) {
    checks[`has_${word}`] = has(word);
  }

  const allSamplesOk = TURKISH_SAMPLES.every((w) => checks[`has_${w}`]);
  checks.turkish_char_samples = allSamplesOk;
  if (!allSamplesOk) {
    const missing = TURKISH_SAMPLES.filter((w) => !checks[`has_${w}`]);
    errors.push(`Missing sample words: ${missing.join(', ')}`);
  }

  return {
    ok: errors.length === 0,
    count,
    checks,
    errors
  };
}

async function main() {
  const path = process.argv[2] || DEFAULT_PATH;
  const result = await validateDictionary(path);
  console.log('Count:', result.count);
  console.log('Checks:', result.checks);
  if (result.errors.length) {
    console.error('Errors:', result.errors);
    process.exit(1);
  }
  console.log('Validation OK');
}

if (process.argv[1]?.endsWith('validate.js')) main();
