import { useEffect, useRef } from 'react';

declare global {
  interface Window { adsbygoogle: unknown[]; }
}

const PUBLISHER_ID = 'ca-pub-8555601165445828';

interface Props {
  slot: string;
  format?: 'banner' | 'rectangle';
}

export function AdBanner({ slot, format = 'banner' }: Props) {
  const isPremium = localStorage.getItem('bombparty-premium') === 'true';
  const pushed = useRef(false);

  useEffect(() => {
    if (isPremium || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch { /* ignore */ }
  }, [isPremium]);

  if (isPremium) return null;

  if (format === 'rectangle') {
    return (
      <ins
        className="adsbygoogle"
        style={{ display: 'inline-block', width: 300, height: 250 }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
      />
    );
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={PUBLISHER_ID}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
