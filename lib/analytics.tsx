'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Google Analytics helpers
declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gtag?: (...args: any[]) => void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fbq?: (...args: any[]) => void;
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
    value?: number;
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
export const trackAppealFiled = (disputeId: number, reason: string) => {
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
