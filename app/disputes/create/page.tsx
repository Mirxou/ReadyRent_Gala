'use client';

// ═══════════════════════════════════════════════════════════════
// /disputes/create — dispute creation entry point
// Prefills the existing multi-step wizard (on /disputes) with the
// booking from ?booking_id= and redirects there. Keeps the
// «إرسال مشكلة» button in /dashboard/orders/[id] wiring real
// (this page was its missing 404 target).
// ═══════════════════════════════════════════════════════════════

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useDisputeStore } from '@/lib/hooks/use-dispute-store';

function CreateDisputeRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const setFormData = useDisputeStore((s) => s.setFormData);
  const resetWizard = useDisputeStore((s) => s.resetWizard);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    if (!isAuthenticated) {
      router.replace('/login?redirect=/disputes/create');
      return;
    }
    handledRef.current = true;
    const bookingId = searchParams.get('booking_id') || undefined;
    resetWizard();
    if (bookingId) setFormData({ bookingId });
    router.replace('/disputes');
  }, [isAuthenticated, searchParams, router, resetWizard, setFormData]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background"
      dir="rtl"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-8 h-8 animate-spin text-sovereign-gold" />
      <p className="text-sm text-muted-foreground">جارٍ فتح نموذج النزاع...</p>
    </div>
  );
}

export default function CreateDisputePage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background"
          dir="rtl"
        >
          <Loader2 className="w-8 h-8 animate-spin text-sovereign-gold" />
          <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
        </div>
      }
    >
      <CreateDisputeRedirect />
    </Suspense>
  );
}
