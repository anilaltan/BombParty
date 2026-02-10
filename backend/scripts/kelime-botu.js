import https from 'https';
import fs from 'fs';

// 2026 itibariyle en kararlı ve silinme ihtimali en düşük "Raw" kaynaklar:
const SOURCES = [
    // 1. Kaynak: Utku Şen'in derlediği Türkçe kelime korpusu (En güvenilir ve geniş kaynaklardan biri)
    'https://raw.githubusercontent.com/utkusen/turkce-wordlist/master/corpus.txt',

    // 2. Kaynak: Mert Emin'in klasik kelime listesi (10+ yıldır yayında, ~63k kelime)
    'https://raw.githubusercontent.com/mertemin/turkish-word-list/master/words.txt',

    // 3. Kaynak: Araya serpiştirilmiş TDK verileri içeren alternatif bir liste
    'https://raw.githubusercontent.com/sahibinden/natural-language-processing-with-turkish/master/data/tr_words.txt'
];

const OUTPUT_FILE = 'dictionary.json';

const downloadWords = (sourceIndex = 0) => {
    if (sourceIndex >= SOURCES.length) {
        console.error('❌ KRİTİK HATA: Tüm kaynaklar denendi ancak erişilemedi.');
        console.error('⚠️ İnternet bağlantını veya GitHub erişimini kontrol et.');
        return;
    }

    const currentUrl = SOURCES[sourceIndex];
    console.log(`⬇️  Bağlanılıyor [Kaynak ${sourceIndex + 1}/${SOURCES.length}]: ...${currentUrl.slice(-40)}`);

    https.get(currentUrl, (res) => {
        // Redirect (301/302) durumlarını takip et (GitHub bazen yönlendirme yapar)
        if (res.statusCode === 301 || res.statusCode === 302) {
            console.log('↪️  Yönlendirme takip ediliyor...');
            downloadWords(sourceIndex); // Yeni lokasyonu otomatik dener (https modülü bazen bunu manuel ister ama raw linklerde genelde direkt gelir)
            return;
        }

        if (res.statusCode !== 200) {
            console.warn(`⚠️  Kaynak ${sourceIndex + 1} yanıt vermedi (${res.statusCode}). Sıradaki deneniyor...`);
            res.resume();
            downloadWords(sourceIndex + 1);
            return;
        }

        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            if (data.length < 1000) { // Eğer gelen veri çok kısaysa (hata mesajı vs.) geçersiz say
                console.warn('⚠️  İndirilen dosya bozuk veya boş görünüyor. Sıradaki deneniyor...');
                downloadWords(sourceIndex + 1);
                return;
            }
            processData(data);
        });

    }).on('error', (err) => {
        console.error(`❌ Bağlantı hatası: ${err.message}`);
        downloadWords(sourceIndex + 1);
    });
};

const processData = (rawData) => {
    console.log('⚙️  Veri indirildi, temizleniyor ve JSON formatına çevriliyor...');

    try {
        const wordArray = rawData
            .split(/\r?\n/)           // Satırlara böl
            .map(word => word.trim()) // Boşlukları al
            .map(word => word.toLocaleLowerCase('tr')) // Hepsini küçük harf yap
            .filter(word => {
                // SIKI FİLTRELEME:
                // 1. En az 2 harfli olsun
                // 2. Sadece Türkçe harflerden oluşsun (Rakam, emoji, nokta vs. varsa at)
                return word.length >= 2 && /^[a-zA-ZçğıöşüÇĞİÖŞÜ]+$/.test(word);
            });

        // Tekrarlananları sil (Set kullanarak)
        const uniqueWords = [...new Set(wordArray)];

        // A-Z Sırala
        uniqueWords.sort((a, b) => a.localeCompare(b, 'tr'));

        const jsonContent = JSON.stringify(uniqueWords, null, 2);
        fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf-8');

        console.log('------------------------------------------------');
        console.log(`✅ İŞLEM BAŞARILI!`);
        console.log(`📊 Toplam Kelime Sayısı: ${uniqueWords.length}`);
        console.log(`📂 Kaydedilen Dosya: ${process.cwd()}/${OUTPUT_FILE}`);
        console.log('------------------------------------------------');
    } catch (e) {
        console.error('❌ İşleme hatası:', e);
    }
};

// Başlat
downloadWords();