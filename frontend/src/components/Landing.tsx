import { useI18n } from '../context/I18nContext';
import { AdBanner } from './AdBanner';

interface Props {
  onPlay: () => void;
  onDictionary: () => void;
  onPrivacy: () => void;
  onTerms: () => void;
}

export function Landing({ onPlay, onDictionary, onPrivacy, onTerms }: Props) {
  const { t } = useI18n();

  const steps = [
    { icon: '🚪', title: t.landingStep1Title, desc: t.landingStep1Desc },
    { icon: '⌨️', title: t.landingStep2Title, desc: t.landingStep2Desc },
    { icon: '💥', title: t.landingStep3Title, desc: t.landingStep3Desc },
  ];

  const features = [
    { icon: '👥', text: t.landingFeat1 },
    { icon: '⚡', text: t.landingFeat2 },
    { icon: '🔤', text: t.landingFeat3 },
    { icon: '🎁', text: t.landingFeat4 },
  ];

  return (
    <div className="lp-root">
      <h1 className="sr-only">KelimeBombası - Ücretsiz Çok Oyunculu Kelime Oyunu</h1>

      {/* Nav */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <img src="/white-icon.png" alt="KelimeBombası" />
          <span>Kelime<span className="lp-nav-accent">Bombası</span></span>
        </div>
        <button className="lp-nav-btn" onClick={onPlay}>{t.landingCta}</button>
      </nav>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-text">
            <span className="lp-badge">{t.landingNoBadge}</span>
            <h1 className="lp-headline">{t.landingHeadline}</h1>
            <p className="lp-subline">{t.landingSubline}</p>
            <div className="lp-cta-row">
              <button className="lp-cta-btn" onClick={onPlay}>{t.landingCta}</button>
              <button className="lp-cta-secondary" onClick={onDictionary}>{t.landingDictBtn}</button>
            </div>
          </div>
          <div className="lp-hero-visual">
            <div className="lp-bomb-wrap">
              <div className="bp-bomb-ring lp-bomb-ring">
                <span className="bp-syllable lp-bomb-syllable">LE</span>
                <span className="bp-syllable-hint">HECE</span>
              </div>
            </div>
            <div className="lp-demo-words">
              <span className="lp-demo-chip">ke<span className="lp-demo-hl">le</span>bek</span>
              <span className="lp-demo-chip">bi<span className="lp-demo-hl">le</span>t</span>
              <span className="lp-demo-chip"><span className="lp-demo-hl">le</span>vent</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="lp-section">
        <span className="lp-section-eyebrow">{t.landingHowTitle}</span>
        <h2 className="lp-section-title">{t.landingHowTitle}</h2>
        <div className="lp-steps">
          {steps.map((s, i) => (
            <div key={i} className="lp-step">
              <div className="lp-step-num">{i + 1}</div>
              <div className="lp-step-icon">{s.icon}</div>
              <div className="lp-step-title">{s.title}</div>
              <p className="lp-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="lp-section lp-features-section">
        <h2 className="lp-section-title">{t.landingFeatTitle}</h2>
        <div className="lp-features">
          {features.map((f, i) => (
            <div key={i} className="lp-feature">
              <span className="lp-feature-icon">{f.icon}</span>
              <span className="lp-feature-text">{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
        <AdBanner slot="2229908248" format="banner" />
      </div>

      {/* Final CTA */}
      <section className="lp-final-cta">
        <p className="lp-final-cta-hint">{t.landingNoBadge} · {t.landingFeat4}</p>
        <div className="lp-final-cta-btns">
          <button className="lp-cta-btn" onClick={onPlay}>{t.landingStartBtn}</button>
          <button className="lp-secondary-btn" onClick={onDictionary}>{t.landingDictBtn}</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-logo">
          <img src="/white-icon.png" alt="KelimeBombası" />
          <span>Kelime<span className="lp-footer-accent">Bombası</span></span>
        </div>
        <p className="lp-footer-tagline">{t.landingFooterTag}</p>
        <div className="lp-footer-links">
          <button className="lp-footer-link" onClick={onDictionary}>{t.landingDictBtn}</button>
          <button className="lp-footer-link" onClick={onPrivacy}>Gizlilik Politikası</button>
          <button className="lp-footer-link" onClick={onTerms}>Kullanım Koşulları</button>
        </div>
      </footer>

    </div>
  );
}
