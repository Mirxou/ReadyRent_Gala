'use client';

import { useState, useEffect } from 'react';
import { SovereignSeal } from '@/shared/components/sovereign/sovereign-seal';
import { JusticeReceipt } from '@/shared/components/sovereign/justice-receipt';
import { ModeSwitcher } from '@/shared/components/sovereign/mode-switcher';
import { DignifiedLoader } from '@/shared/components/sovereign/dignified-loader';
import { useSovereign } from '@/contexts/SovereignContext';

export default function SovereignShowcasePage() {
  const { setMode } = useSovereign();
  const [loading, setLoading] = useState(false);

  // Force DISPUTE mode on mount for dramatic effect
  useEffect(() => {
    setMode('DISPUTE');
  }, [setMode]);

  const receiptStages: Array<{ label_ar?: string; timestamp?: string; status: 'completed' | 'active' | 'pending' }> = [];

  return (
    <div className="min-h-screen p-12 pb-32 space-y-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-700">

      {/* Header */}
      <header className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 dark:text-white">
          معرض واجهة ستاندرد
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
          اللغة البصرية للجيل السابع. راقية، خالدة، وسلطوية.
        </p>
      </header>

      {/* Section 1: The Seals */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold border-r-4 border-amber-500 pr-4 text-slate-800 dark:text-slate-200">
          أختام ستاندرد
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 justify-items-center">
          <div className="space-y-4 text-center">
            <SovereignSeal type="SHIELD_SILVER" refId="CASE-2026-001" className="bg-white dark:bg-slate-900 rounded-xl shadow-lg" />
            <div className="text-sm font-medium text-slate-500">درع فضي (معلّق)</div>
          </div>

          <div className="space-y-4 text-center">
            <SovereignSeal type="BALANCE_GOLD" refId="VERDICT-8821" className="bg-white dark:bg-slate-900 rounded-xl shadow-xl ring-1 ring-amber-500/20" />
            <div className="text-sm font-medium text-amber-600">توازن ذهبي (القرار النهائي)</div>
          </div>

          <div className="space-y-4 text-center">
            <SovereignSeal type="DOCUMENT_GREY" refId="DOC-REF-99" className="bg-white dark:bg-slate-900 rounded-xl shadow-sm opacity-80" animate={false} />
            <div className="text-sm font-medium text-slate-400">وثيقة رمادية (أرشيف)</div>
          </div>
        </div>
      </section>

      {/* Section 2: The Justice Receipt */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold border-r-4 border-blue-500 pr-4 text-slate-800 dark:text-slate-200">
          إيصال العدالة
        </h2>
        <div className="flex flex-col md:flex-row gap-12 items-center justify-center">
          <JusticeReceipt
            stages={receiptStages}
            disputeId="DSP-9928-XA"
          />

          <JusticeReceipt
            stages={receiptStages.map(s => ({ ...s, status: 'completed' }))}
            disputeId="DSP-9928-FINAL"
            finalVerdict="حكم لصالح المؤجر (تعويض كامل)"
          />
        </div>
      </section>

      {/* Section 3: Dignified Loading */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold border-r-4 border-slate-500 pr-4 text-slate-800 dark:text-slate-200">
          الحالات الراقية
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl shadow-inner flex justify-center">
            <DignifiedLoader label="جارٍ استدعاء القوانين..." />
          </div>

          <div className="flex flex-col items-center justify-center gap-4">
            <button
              onClick={() => setLoading(!loading)}
              className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium"
            >
              تشغيل جهاز العرض التجريبي (أدناه)
            </button>
            {loading && <DignifiedLoader />}
            <p className="text-sm text-slate-500">
              (لاحظي الشريط العائم أسفل الشاشة)
            </p>
          </div>
        </div>
      </section>

      <ModeSwitcher />

      <div className="fixed bottom-4 right-4 text-[10px] text-slate-300 pointer-events-none font-mono">
        الجيل ٧ :: المرحلة ٤٧ :: الإصدار ٠.١
      </div>
    </div>
  );
}
