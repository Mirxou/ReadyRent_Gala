'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Google Analytics helpers
// NOTE: signature must match lib/analytics-client.ts (unknown[] args) —
// two `declare global` blocks for Window.gtag must agree exactly.
declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
        fbq?: (...args: unknown[]) => void;
    }
}

export const pageview = (url: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
            page_path: url,
        });
    }
};

export const event = ({
    action,
    category,
    label,
    value,
}: {
    action: string;
    category: string;
    label?: string;
    // GA accepts string | number for event value (e.g. dispute id)
    value?: string | number;
}) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }

    // Facebook Pixel event
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', action, {
            content_category: category,
            content_name: label,
            value: value,
        });
    }
};

// Specific tracking functions
export const trackSearch = (searchTerm: string) => {
    event({
        action: 'search',
        category: 'engagement',
        label: searchTerm,
    });
};

// Judicial & Dispute Tracking
export const trackAppealFiled = (disputeId: string | number, reason: string) => {
    event({
        action: 'appeal_filed',
        category: 'judicial',
        label: reason,
        value: disputeId,
    });
};



// Default export for usage in Layout
function AnalyticsComponent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (pathname) {
            pageview(pathname);
        }
    }, [pathname, searchParams]);

    return null;
}

export default function Analytics() {
    return (
        <Suspense fallback={null}>
            <AnalyticsComponent />
        </Suspense>
    );
}
