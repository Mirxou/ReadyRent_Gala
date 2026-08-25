// Extend Window to include gtag

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    // Google Analytics 4
    window.gtag?.('event', eventName, properties);
  }
  // Debug-only: uncomment below for analytics debugging
  // console.warn('[ANALYTICS]', eventName, properties);
}

export function pageView(url: string) {
  trackEvent('page_view', { page: url });
}
