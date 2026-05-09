declare function gtag(...args: unknown[]): void;

export function trackEvent(name: string, params?: Record<string, string | number>) {
  try {
    if (typeof gtag === 'undefined') return;
    gtag('event', name, params ?? {});
  } catch { /* ignore */ }
}
