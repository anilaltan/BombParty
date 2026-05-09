interface Props {
  onBack: () => void;
  onTerms: () => void;
}

export function Privacy({ onBack, onTerms }: Props) {
  return (
    <div className="legal-root">
      <nav className="legal-nav">
        <button className="legal-back-btn" onClick={onBack}>← Ana Sayfa</button>
        <span className="legal-nav-brand">KelimeBombası</span>
      </nav>

      <main className="legal-main">
        <h1 className="legal-title">Gizlilik Politikası</h1>
        <p className="legal-date">Son güncelleme: 9 Mayıs 2026</p>

        <section className="legal-section">
          <h2>1. Veri Sorumlusu</h2>
          <p>
            KelimeBombası (<strong>kelimebombasi.com</strong>) adresinde sunulan bu hizmetin veri sorumlusu
            bireysel bir geliştiriciden oluşmaktadır. İletişim: <strong>support@kelimebombasi.com</strong>
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Toplanan Veriler</h2>
          <p>Hizmetimizi kullanırken aşağıdaki veriler işlenebilir:</p>
          <ul>
            <li>
              <strong>Takma ad (nickname):</strong> Oyun oturumu süresince sunucu belleğinde tutulur.
              Oyun sona erdiğinde veya sunucu yeniden başlatıldığında silinir. Kalıcı olarak saklanmaz.
            </li>
            <li>
              <strong>IP adresi:</strong> Sunucu günlüklerinde kısa süreli tutulur. Güvenlik ve hata
              tespiti amacıyla kullanılır.
            </li>
            <li>
              <strong>Kullanım verileri:</strong> Google Analytics 4 aracılığıyla anonim kullanım
              istatistikleri toplanır (sayfa görüntüleme, oyun süresi vb.).
            </li>
            <li>
              <strong>Reklam verileri:</strong> Google AdSense, ilgi alanına dayalı reklam sunmak
              amacıyla çerezler kullanabilir.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Verilerin Kullanım Amacı</h2>
          <ul>
            <li>Oyun hizmetinin çalıştırılması ve iyileştirilmesi</li>
            <li>Kullanım istatistiklerinin analizi (anonim)</li>
            <li>Teknik hataların tespiti ve giderilmesi</li>
            <li>Reklam geliri elde edilmesi (Google AdSense)</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Çerezler</h2>
          <p>Sitemiz aşağıdaki çerezleri kullanır:</p>
          <ul>
            <li>
              <strong>Zorunlu çerezler:</strong> Oyun oturumu ve dil tercihi gibi temel işlevler için
              kullanılır (localStorage).
            </li>
            <li>
              <strong>Analitik çerezler:</strong> Google Analytics 4 tarafından kullanım verilerini
              toplamak amacıyla kullanılır.
            </li>
            <li>
              <strong>Reklam çerezleri:</strong> Google AdSense tarafından ilgili reklamlar sunmak
              amacıyla kullanılır.
            </li>
          </ul>
          <p>
            Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz. Ancak bu durumda bazı
            hizmet özellikleri düzgün çalışmayabilir.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Üçüncü Taraf Hizmetler</h2>
          <ul>
            <li>
              <strong>Google Analytics 4:</strong> Kullanım verilerini anonimleştirerek analiz eder.
              Google'ın gizlilik politikası için: policies.google.com/privacy
            </li>
            <li>
              <strong>Google AdSense:</strong> Reklam hizmeti sunar ve çerezler kullanabilir.
              Google'ın reklam politikası için: policies.google.com/technologies/ads
            </li>
            <li>
              <strong>Cloudflare:</strong> CDN ve güvenlik hizmetleri için kullanılır. Bağlantı
              verilerini işleyebilir.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Veri Saklama Süresi</h2>
          <ul>
            <li>Takma adlar: Oyun oturumu süresince (kalıcı olarak saklanmaz)</li>
            <li>Sunucu günlükleri: 30 güne kadar</li>
            <li>Google Analytics verileri: 14 ay</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. KVKK Kapsamındaki Haklarınız</h2>
          <p>
            6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca aşağıdaki haklara sahipsiniz:
          </p>
          <ul>
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme hakkı</li>
            <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme hakkı</li>
            <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp
              kullanılmadığını öğrenme hakkı</li>
            <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri
              bilme hakkı</li>
            <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların
              düzeltilmesini isteme hakkı</li>
            <li>Kişisel verilerinizin silinmesini veya yok edilmesini isteme hakkı</li>
          </ul>
          <p>
            Bu haklarınızı kullanmak için <strong>support@kelimebombasi.com</strong> adresine
            e-posta gönderebilirsiniz.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. 13 Yaş Sınırı</h2>
          <p>
            Hizmetimiz 13 yaşın altındaki çocuklara yönelik değildir. 13 yaşından küçük birinin
            verilerini topladığımızı fark edersek bu verileri derhal sileriz.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Politika Değişiklikleri</h2>
          <p>
            Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler bu sayfada
            yayımlanır. Hizmeti kullanmaya devam etmeniz güncel politikayı kabul ettiğiniz
            anlamına gelir.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. İletişim</h2>
          <p>
            Sorularınız için: <strong>support@kelimebombasi.com</strong>
          </p>
        </section>

        <div className="legal-footer-links">
          <button className="legal-link-btn" onClick={onTerms}>Kullanım Koşulları</button>
          <button className="legal-link-btn" onClick={onBack}>Ana Sayfaya Dön</button>
        </div>
      </main>
    </div>
  );
}
