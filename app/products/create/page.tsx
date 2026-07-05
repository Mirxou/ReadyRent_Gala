'use client';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

export default function CreateProductPage() {
  return (
    <div className="min-h-screen bg-sovereign-obsidian pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/products" className="inline-flex items-center gap-2 text-white/40 hover:text-sovereign-gold text-xs font-black uppercase tracking-widest mb-8">
          <ArrowLeft className="w-4 h-4 rotate-180" /> العودة للمنتجات
        </Link>
        <h1 className="text-4xl font-black italic mb-8">إضافة <span className="text-sovereign-gold">منتجك</span></h1>
        <GlassPanel className="p-10" variant="obsidian" gradientBorder>
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <Plus className="w-16 h-16 text-sovereign-gold/40" />
            <p className="text-white/40 text-lg">نموذج إضافة المنتج سيكون متاحاً قريباً</p>
            <SovereignButton variant="secondary" asChild>
              <Link href="/products">تصفح المنتجات</Link>
            </SovereignButton>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}