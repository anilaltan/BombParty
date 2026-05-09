interface Props {
  onBack: () => void;
  onPrivacy: () => void;
}

export function Terms({ onBack, onPrivacy }: Props) {
  return (
    <div className="legal-root">
      <nav className="legal-nav">
        <button className="legal-back-btn" onClick={onBack}>← Ana Sayfa</button>
        <span className="legal-nav-brand">KelimeBombası</span>
      </nav>

      <main className="legal-main">
        <h1 className="legal-title">Kullanım Koşulları</h1>
        <p className="legal-date">Son güncelleme: 9 Mayıs 2026</p>

        <section className="legal-section">
          <h2>1. Kabul</h2>
          <p>
            KelimeBombası'nı (<strong>kelimebombasi.com</strong>) kullanarak bu kullanım koşullarını
            kabul etmiş sayılırsınız. Koşulları kabul etmiyorsanız hizmeti kullanmayınız.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Hizmet Tanımı</h2>
          <p>
            KelimeBombası, Türkçe kelimelerle oynanan gerçek zamanlı çok oyunculu bir kelime oyunudur.
            Hizmet ücretsiz sunulmaktadır. Reklam içerebilir ve isteğe bağlı premium özellikler
            sunabilir.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Yaş Sınırı</h2>
          <p>
            Hizmeti kullanmak için en az <strong>13 yaşında</strong> olmanız gerekmektedir.
            13 yaşından küçükseniz lütfen bir ebeveyn veya vasinin gözetiminde kullanınız.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Kullanım Kuralları</h2>
          <p>Aşağıdaki davranışlar kesinlikle yasaktır:</p>
          <ul>
            <li>Hakaret, küfür veya taciz içeren takma ad veya mesaj kullanmak</li>
            <li>Oyunu bozmaya yönelik hile veya bot kullanmak</li>
            <li>Sistemi kasıtlı olarak aşırı yüklemeye çalışmak (DDoS, spam vb.)</li>
            <li>Başka oyuncuların deneyimini kasıtlı olarak bozmak</li>
            <li>Yasadışı içerik paylaşmak veya yaymak</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Hesap ve Takma Ad</h2>
          <p>
            KelimeBombası hesap kaydı gerektirmez. Seçtiğiniz takma ad yalnızca oyun oturumu
            süresince geçerlidir ve kalıcı olarak saklanmaz. Uygunsuz takma adlar sunucu
            tarafından reddedilebilir.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Hizmetin Askıya Alınması</h2>
          <p>
            Kurallara aykırı davranan kullanıcılar önceden bildirim yapılmaksızın hizmetten
            engellenebilir. Bu karara itiraz için <strong>support@kelimebombasi.com</strong>
            adresine başvurabilirsiniz.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Fikri Mülkiyet</h2>
          <p>
            KelimeBombası markası, tasarımı ve yazılımı geliştiriciye aittir. Oyun içeriğini
            izinsiz kopyalamak, dağıtmak veya ticari amaçla kullanmak yasaktır.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Sorumluluk Reddi</h2>
          <p>
            Hizmet <strong>"olduğu gibi"</strong> sunulmaktadır. Kesintisiz veya hatasız
            çalışması garanti edilmez. Hizmetin kullanımından doğabilecek doğrudan veya
            dolaylı zararlardan geliştirici sorumlu tutulamaz.
          </p>
          <p>
            Hizmetin geçici veya kalıcı olarak durdurulması, değiştirilmesi ya da sona
            erdirilmesi hakkı saklıdır.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Reklam</h2>
          <p>
            Hizmet, Google AdSense aracılığıyla reklam içerebilir. Premium üyelik satın alan
            kullanıcılar reklamlardan muaf tutulur. Reklam verileri hakkında daha fazla
            bilgi için Gizlilik Politikamızı inceleyiniz.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Premium Özellikler</h2>
          <p>
            İsteğe bağlı premium özellikler tek seferlik ödemeyle satın alınabilir. Satın alma
            tarayıcı belleğine (localStorage) kaydedilir. Tarayıcı verilerinin temizlenmesi
            durumunda erişim kaybolabilir; bu durumda <strong>support@kelimebombasi.com</strong>
            adresine başvurabilirsiniz.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Uygulanacak Hukuk</h2>
          <p>
            Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda Türk mahkemeleri
            yetkilidir.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. Değişiklikler</h2>
          <p>
            Bu koşullar zaman zaman güncellenebilir. Güncel versiyon her zaman bu sayfada
            yayımlanır. Hizmeti kullanmaya devam etmeniz güncel koşulları kabul ettiğiniz
            anlamına gelir.
          </p>
        </section>

        <section className="legal-section">
          <h2>13. İletişim</h2>
          <p>
            Sorularınız için: <strong>support@kelimebombasi.com</strong>
          </p>
        </section>

        <div className="legal-footer-links">
          <button className="legal-link-btn" onClick={onPrivacy}>Gizlilik Politikası</button>
          <button className="legal-link-btn" onClick={onBack}>Ana Sayfaya Dön</button>
        </div>
      </main>
    </div>
  );
}
