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
export const trackProductView = (productId: number, productName: string) => {
    event({
        action: 'view_item',
        category: 'ecommerce',
        label: productName,
        value: productId,
    });
};

export const trackAddToCart = (productId: number, productName: string, price: number) => {
    event({
        action: 'add_to_cart',
        category: 'ecommerce',
        label: productName,
        value: price,
    });
};

export const trackBooking = (bookingId: number, totalPrice: number) => {
    event({
        action: 'purchase',
        category: 'ecommerce',
        label: `Booking ${bookingId}`,
        value: totalPrice,
    });
};

export const trackSearch = (searchTerm: string) => {
    event({
        action: 'search',
        category: 'engagement',
        label: searchTerm,
    });
};

// Conversion Funnel Tracking
export const trackFunnelStage = (stage: string, metadata?: Record<string, any>) => {
    event({
        action: 'funnel_stage',
        category: 'conversion',
        label: stage,
        value: metadata?.productId,
    });
};

// A/B Testing
export const trackABTest = (testName: string, variant: string, conversion: boolean = false) => {
    event({
        action: conversion ? 'ab_test_conversion' : 'ab_test_view',
        category: 'ab_testing',
        label: `${testName}_${variant}`,
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
