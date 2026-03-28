import type { Metadata } from 'next';
import { TrustScoreDashboard } from '@/components/trust/TrustScoreDashboard';

export const metadata: Metadata = {
  title: 'نقاط الثقة',
  description: 'راجع نقاط الثقة الخاصة بك: سجل الدفع، الالتزام بالعقود، تاريخ النزاعات، وتقييمات المجتمع.',
};

export default function TrustScorePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pt-10">
      <TrustScoreDashboard />
    </main>
  );
}
