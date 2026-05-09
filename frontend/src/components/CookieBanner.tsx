import { useState } from 'react';

const CONSENT_KEY = 'bombparty-cookie-consent';

interface Props {
  onPrivacy: () => void;
}

export function CookieBanner({ onPrivacy }: Props) {
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem(CONSENT_KEY); } catch { return false; }
  });

  if (!visible) return null;

  function accept() {
    try { localStorage.setItem(CONSENT_KEY, 'true'); } catch { /* ignore */ }
    setVisible(false);
  }

  return (
    <div className="cookie-banner">
      <p className="cookie-text">
        Bu site deneyimi iyileştirmek ve reklam sunmak için çerez kullanır.{' '}
        <button className="cookie-link" onClick={onPrivacy}>Gizlilik Politikası</button>
      </p>
      <button className="cookie-accept" onClick={accept}>Kabul Et</button>
    </div>
  );
}
