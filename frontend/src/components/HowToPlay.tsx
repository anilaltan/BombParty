import { useI18n } from '../context/I18nContext';
import { AdBanner } from './AdBanner';

interface Props {
  onBack: () => void;
}

export function HowToPlay({ onBack }: Props) {
  const { lang } = useI18n();

  if (lang === 'en') {
    return (
      <div className="legal-root">
        <nav className="legal-nav">
          <button className="legal-back-btn" onClick={onBack}>← Back</button>
          <span className="legal-nav-brand">KelimeBombası</span>
        </nav>

        <main className="legal-main">
          <h1 className="legal-title">How to Play KelimeBombası</h1>
          <p className="legal-date">The Turkish multiplayer word game — fast, competitive, and free</p>

          <section className="legal-section">
            <h2>What is KelimeBombası?</h2>
            <p>
              KelimeBombası (Word Bomb) is a real-time multiplayer word game for 2–12 players. A syllable appears
              on the screen and a countdown timer begins. You must type a Turkish word that contains that syllable
              before the bomb explodes. Each correct answer keeps you in the game; running out of time costs you a life.
              The last player standing wins.
            </p>
            <p>
              The game is designed around the Turkish language and its 29-letter alphabet (including special characters
              like ç, ğ, ı, İ, ö, ş, and ü). All words are validated against a curated dictionary of tens of thousands
              of Turkish words.
            </p>
          </section>

          <section className="legal-section">
            <h2>Step 1 — Create or Join a Room</h2>
            <p>
              No account is required. Enter a nickname and choose an avatar, then either create a new room or enter
              a 6-character room code shared by a friend. You can also browse public rooms and join one instantly.
            </p>
            <p>
              When creating a room, you can configure:
            </p>
            <ul>
              <li><strong>Turn duration</strong> — fixed (e.g. 15 seconds) or a random range (e.g. 10–20 seconds)</li>
              <li><strong>Maximum players</strong> — from 2 to 12</li>
              <li><strong>Room visibility</strong> — public (visible in the lobby list) or private (invite only)</li>
            </ul>
            <p>
              Share the 6-character room code or the direct room link with your friends. Once everyone is in,
              mark yourself as ready. The host can start the game when all players are ready.
            </p>
          </section>

          <section className="legal-section">
            <h2>Step 2 — Find the Word</h2>
            <p>
              Each turn, a syllable is displayed in the center of the screen. The active player must type a Turkish
              word that contains this syllable anywhere within it — at the beginning, middle, or end — and submit
              it before the timer runs out.
            </p>
            <p>
              Examples: If the syllable is <strong>LE</strong>, valid words include <em>kelebek</em> (butterfly),
              <em>balet</em>, <em>telefonla</em>, <em>eller</em>, or hundreds of others. The word must appear in the
              Turkish dictionary used by the game.
            </p>
            <p>
              Each word can only be used once per game. Words are case-insensitive and automatically normalized for
              Turkish characters. You cannot reuse a word another player already submitted in the same session.
            </p>
          </section>

          <AdBanner slot="5298924717" format="rectangle" />

          <section className="legal-section">
            <h2>Step 3 — Score Points and Stay Alive</h2>
            <p>
              Every valid word you submit earns one point. Your score is tracked throughout the game and shown in
              the final results. Accumulating points does not protect your lives — you must submit in time every turn.
            </p>
            <p>
              Each player starts with 3 lives. If the timer runs out before you submit a valid word, the bomb
              explodes and you lose one life. Lose all 3 lives and you are eliminated.
            </p>
            <p>
              The game continues, skipping eliminated players, until only one player remains. That player is
              declared the winner, along with a final scoreboard showing everyone's total words submitted.
            </p>
          </section>

          <section className="legal-section">
            <h2>Turkish Alphabet Bonus</h2>
            <p>
              KelimeBombası tracks which letters of the 29-letter Turkish alphabet you have used across all your
              submitted words. The alphabet includes: A, B, C, Ç, D, E, F, G, Ğ, H, I, İ, J, K, L, M, N, O, Ö,
              P, R, S, Ş, T, U, Ü, V, Y, Z.
            </p>
            <p>
              If you manage to use all 29 letters across your submitted words, you earn an alphabet bonus: you gain
              one extra life and your letter tracker resets. This gives an advantage to players with a wide vocabulary
              and encourages creative word choices beyond the obvious ones.
            </p>
            <p>
              The letter tracker is shown as colored dots next to your name during the game. Letters you have used
              are highlighted; unused letters remain dimmed.
            </p>
          </section>

          <section className="legal-section">
            <h2>Tips and Strategies</h2>
            <ul>
              <li>Look for uncommon syllable positions — if the syllable is at the end, try words where it appears in the middle too.</li>
              <li>Think about letters you still need for the alphabet bonus when choosing between multiple valid words.</li>
              <li>Short words are fast to type but leave fewer letter options; longer words take more time but score letters efficiently.</li>
              <li>Watch what words other players submit — you cannot reuse them, so eliminate common words early.</li>
              <li>If you are stuck, try compound words or verb conjugations — Turkish is a highly agglutinative language with many valid forms.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Frequently Asked Questions</h2>
            <p><strong>Is KelimeBombası free?</strong><br />Yes, completely free to play. No account, no downloads, no fees.</p>
            <p><strong>How many players can join?</strong><br />Between 2 and 12 players per room.</p>
            <p><strong>Can I play on mobile?</strong><br />Yes, the game runs in any modern browser on desktop or mobile.</p>
            <p><strong>What language is the dictionary?</strong><br />Turkish only. All words are validated against a Turkish dictionary.</p>
            <p><strong>Can I use proper nouns?</strong><br />No, only common nouns and standard Turkish words are accepted.</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="legal-root">
      <nav className="legal-nav">
        <button className="legal-back-btn" onClick={onBack}>← Geri</button>
        <span className="legal-nav-brand">KelimeBombası</span>
      </nav>

      <main className="legal-main">
        <h1 className="legal-title">KelimeBombası Nasıl Oynanır?</h1>
        <p className="legal-date">Türkçe çok oyunculu kelime oyunu — hızlı, rekabetçi ve ücretsiz</p>

        <section className="legal-section">
          <h2>KelimeBombası Nedir?</h2>
          <p>
            KelimeBombası, 2 ila 12 oyuncu için gerçek zamanlı bir çok oyunculu kelime oyunudur. Ekranda bir hece
            belirir ve geri sayım başlar. Bomba patlamadan önce o heceyi içeren Türkçe bir kelime yazman gerekir.
            Her doğru cevap seni oyunda tutar; süreyi geçirirsen bir can kaybedersin. Son ayakta kalan oyuncu kazanır.
          </p>
          <p>
            Oyun, Türk dili ve 29 harfli Türk alfabesi (ç, ğ, ı, İ, ö, ş, ü gibi özel karakterler dahil) üzerine
            kurulmuştur. Tüm kelimeler, on binlerce Türkçe kelimeden oluşan seçilmiş bir sözlüğe göre doğrulanır.
          </p>
        </section>

        <section className="legal-section">
          <h2>Adım 1 — Oda Oluştur veya Katıl</h2>
          <p>
            Hesap açmana gerek yok. Bir takma ad gir ve avatar seç, ardından yeni bir oda oluştur ya da
            bir arkadaşın paylaştığı 6 karakterlik oda kodunu gir. Ayrıca açık odaları göz atabilir ve
            anında katılabilirsin.
          </p>
          <p>
            Oda oluştururken şunları yapılandırabilirsin:
          </p>
          <ul>
            <li><strong>Tur süresi</strong> — sabit (örneğin 15 saniye) veya rastgele aralık (örneğin 10–20 saniye)</li>
            <li><strong>Maksimum oyuncu sayısı</strong> — 2'den 12'ye kadar</li>
            <li><strong>Oda görünürlüğü</strong> — herkese açık (lobi listesinde görünür) veya gizli (yalnızca davetiye)</li>
          </ul>
          <p>
            6 karakterlik oda kodunu veya doğrudan oda bağlantısını arkadaşlarınla paylaş. Herkes odaya
            girdikten sonra kendini hazır olarak işaretle. Ev sahibi, tüm oyuncular hazır olduğunda oyunu başlatabilir.
          </p>
        </section>

        <section className="legal-section">
          <h2>Adım 2 — Kelimeyi Bul</h2>
          <p>
            Her turda ekranın ortasında bir hece belirir. Aktif oyuncu, bu heceyi başında, ortasında veya
            sonunda içeren bir Türkçe kelime yazmalı ve zamanlayıcı bitmeden göndermeli.
          </p>
          <p>
            Örnek: Hece <strong>LE</strong> ise geçerli kelimeler arasında <em>kelebek</em>, <em>balet</em>,
            <em>telefonla</em>, <em>eller</em> veya yüzlerce başka kelime sayılabilir. Kelime, oyunun kullandığı
            Türkçe sözlükte yer almalıdır.
          </p>
          <p>
            Her kelime oyun boyunca yalnızca bir kez kullanılabilir. Kelimeler büyük/küçük harf duyarsızdır ve
            Türkçe karakterler için otomatik olarak normalleştirilir. Aynı oturumda başka bir oyuncunun zaten
            kullandığı bir kelimeyi tekrar kullanamazsın.
          </p>
        </section>

        <AdBanner slot="5298924717" format="rectangle" />

        <section className="legal-section">
          <h2>Adım 3 — Puan Kazan ve Hayatta Kal</h2>
          <p>
            Gönderdiğin her geçerli kelime bir puan kazandırır. Puanın oyun boyunca takip edilir ve
            final sonuçlarında gösterilir. Puan biriktirmek canlarını korumaz — her turda zamanında göndermelisin.
          </p>
          <p>
            Her oyuncu 3 canla başlar. Geçerli bir kelime göndermeden zamanlayıcı biterse bomba patlar ve
            bir can kaybedersin. 3 canın da biterse elenir sin.
          </p>
          <p>
            Oyun, elenen oyuncuları atlayarak devam eder; ta ki tek bir oyuncu kalana dek. O oyuncu kazanan
            ilan edilir ve herkesin toplam gönderdiği kelime sayısını gösteren final skor tablosu gösterilir.
          </p>
        </section>

        <section className="legal-section">
          <h2>Türkçe Alfabe Bonusu</h2>
          <p>
            KelimeBombası, gönderdiğin tüm kelimelerde 29 harfli Türk alfabesinin hangi harflerini
            kullandığını takip eder. Alfabe şu harfleri içerir: A, B, C, Ç, D, E, F, G, Ğ, H, I, İ, J, K, L,
            M, N, O, Ö, P, R, S, Ş, T, U, Ü, V, Y, Z.
          </p>
          <p>
            Gönderdiğin kelimeler aracılığıyla 29 harfin tamamını kullanmayı başararsan alfabe bonusu kazanırsın:
            Bir ekstra can kazanırsın ve harf takipçin sıfırlanır. Bu, geniş kelime dağarcığına sahip oyunculara
            avantaj sağlar ve bariz olanların ötesinde yaratıcı kelime seçimlerini teşvik eder.
          </p>
          <p>
            Harf takipçisi oyun sırasında adının yanında renkli noktalar olarak gösterilir. Kullandığın
            harfler vurgulanır; kullanılmayanlar soluk kalır.
          </p>
        </section>

        <section className="legal-section">
          <h2>İpuçları ve Stratejiler</h2>
          <ul>
            <li>Alışılmadık hece pozisyonlarına bak — hece sonda ise, ortada geçen kelimeler de dene.</li>
            <li>Birden fazla geçerli kelime arasında seçim yaparken, alfabe bonusu için hâlâ ihtiyaç duyduğun harfleri düşün.</li>
            <li>Kısa kelimeler yazmak hızlıdır ama daha az harf seçeneği sunar; uzun kelimeler daha fazla zaman alır ama harfleri verimli şekilde toplar.</li>
            <li>Diğer oyuncuların hangi kelimeleri gönderdiğine dikkat et — onları tekrar kullanamazsın, bu yüzden yaygın kelimeleri erken tüket.</li>
            <li>Takılıp kalırsanız bileşik kelimeler veya fiil çekimleri dene — Türkçe son derece eklemeli bir dil olup çok sayıda geçerli biçim sunar.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Sıkça Sorulan Sorular</h2>
          <p><strong>KelimeBombası ücretsiz mi?</strong><br />Evet, tamamen ücretsiz. Hesap, indirme veya ücret yok.</p>
          <p><strong>Kaç oyuncu katılabilir?</strong><br />Oda başına 2 ile 12 oyuncu arasında.</p>
          <p><strong>Mobilde oynayabilir miyim?</strong><br />Evet, oyun masaüstü veya mobilde herhangi bir modern tarayıcıda çalışır.</p>
          <p><strong>Sözlük hangi dilde?</strong><br />Yalnızca Türkçe. Tüm kelimeler bir Türkçe sözlüğe göre doğrulanır.</p>
          <p><strong>Özel isimler kullanabilir miyim?</strong><br />Hayır, yalnızca ortak isimler ve standart Türkçe kelimeler kabul edilir.</p>
        </section>
      </main>
    </div>
  );
}
