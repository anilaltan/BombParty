import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_PATH = path.join(DATA_DIR, 'dictionary.json');

const SOURCES = [
    'https://raw.githubusercontent.com/CanNuhlar/Turkce-Kelime-Listesi/refs/heads/master/turkce_kelime_listesi.txt',
    'https://raw.githubusercontent.com/utkusen/turkce-wordlist/master/corpus.txt',
    'https://raw.githubusercontent.com/mertemin/turkish-word-list/master/words.txt',
    'https://raw.githubusercontent.com/sahibinden/natural-language-processing-with-turkish/master/data/tr_words.txt',
];

const MIN_LEN = 2;
const MAX_LEN = 30;
const TURKISH_ALPHA = /^[a-zçğıöşü]+$/;
const MIN_RAW_LENGTH = 1000;

const fetchUrl = (url, baseUrl = url) =>
    new Promise((resolve, reject) => {
        const resolved = url.startsWith('http') ? url : new URL(url, baseUrl).href;
        https.get(resolved, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                const loc = res.headers.location;
                if (loc) {
                    res.resume();
                    return fetchUrl(loc, resolved).then(resolve).catch(reject);
                }
            }
            if (res.statusCode !== 200) {
                res.resume();
                return resolve(null);
            }
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data.length >= MIN_RAW_LENGTH ? data : null));
        }).on('error', reject);
    });

const parseWords = (raw) =>
    raw
        .split(/\r?\n/)
        .map((w) => w.trim().toLocaleLowerCase('tr-TR').normalize('NFC'))
        .filter((w) => w.length >= MIN_LEN && w.length <= MAX_LEN && TURKISH_ALPHA.test(w));

const main = async () => {
    const results = await Promise.allSettled(
        SOURCES.map((url, i) => {
            console.log(`⬇️ [${i + 1}/${SOURCES.length}] ${url.slice(-50)}`);
            return fetchUrl(url);
        })
    );

    const allRaw = results
        .map((r) => (r.status === 'fulfilled' ? r.value : null))
        .filter(Boolean);

    if (allRaw.length === 0) {
        console.error('❌ Hiçbir kaynaktan veri alınamadı.');
        return;
    }

    console.log(`📥 ${allRaw.length}/${SOURCES.length} kaynak indirildi. Birleştiriliyor...`);

    const allWords = allRaw.flatMap(parseWords);
    const unique = [...new Set(allWords)];
    unique.sort((a, b) => a.localeCompare(b, 'tr'));

    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(unique, null, 2), 'utf-8');

    console.log('------------------------------------------------');
    console.log(`✅ Toplam: ${unique.length} kelime (kopyalar çıkarıldı)`);
    console.log(`📂 ${OUTPUT_PATH}`);
    console.log('------------------------------------------------');
};

main().catch((err) => {
    console.error('❌', err.message);
    process.exit(1);
});
