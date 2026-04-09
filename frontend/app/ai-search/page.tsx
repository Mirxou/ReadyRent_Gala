'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi, type Product } from '@/lib/api/products';
import { chatbotApi } from '@/lib/api/innovation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Search,
  Loader2,
  Mic,
  ArrowRight,
  Tag,
  MapPin,
  Shield,
  FileCheck,
  Lock,
  CreditCard,
  X,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { trackSearch } from '@/lib/analytics';
import { Badge } from '@/components/ui/badge';

// ── Suggestion chips ──────────────────────────────────────────────────────────
const QUICK_SUGGESTIONS = [
  'فستان سهرة للتأجير في الجزائر العاصمة',
  'فستان زفاف أبيض فاخر',
  'تلبيسة أنيقة لحفلة خطوبة',
  'فستان عيد ميلاد للأطفال',
  'جلابية تقليدية بسعر معقول',
];

// ── Product card (compact) ────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const mainImage = product.images?.find((i) => i.is_main)?.url ?? product.images?.[0]?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow group"
    >
      <Link href={`/products/${product.slug || product.id}`}>
        {/* Image */}
        <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <Tag className="w-10 h-10" />
            </div>
          )}
          {product.is_available && (
            <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              متاح
            </span>
          )}
        </div>
        {/* Info */}
        <div className="p-4 space-y-1.5">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
            {product.name}
          </p>
          {product.location_name && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              {product.location_name}
            </div>
          )}
          <p className="text-base font-black text-blue-600">
            {product.price_per_day.toLocaleString('ar-DZ')} دج<span className="text-xs font-normal text-slate-400">/يوم</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Trust score explainer ──────────────────────────────────────────────────
function TrustScoreExplainer() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-colors" />
      
      <div className="flex gap-4 items-start relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 flex-shrink-0">
          <Shield className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            لماذا تظهر هذه النتائج أولاً؟
            <Badge variant="outline" className="text-[10px] border-indigo-500/50 text-indigo-400">نظام الثقة السيادي</Badge>
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            نقوم بترتيب المنتجات بناءً على «نقاط الثقة» للمؤجرين. هذا النظام المتطور يضمن لك تجربة آمنة عبر تحليل 3 معايير سيادية:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
            {[
              { label: 'التزام العقود', icon: FileCheck, color: 'text-emerald-400' },
              { label: 'موثوقية الدفع', icon: CreditCard, color: 'text-amber-400' },
              { label: 'الضمان المالي', icon: Lock, color: 'text-blue-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl text-xs font-medium text-slate-300">
                <item.icon className={cn('w-4 h-4', item.color)} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── AI explainer box ──────────────────────────────────────────────────────────
function AIExplainer({ query, onDismiss }: { query: string; onDismiss: () => void }) {
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setReply('');

    const fetchExplainer = async () => {
      try {
        const res = await chatbotApi.quickChat(
          `أريد استئجار: "${query}". ما نصيحتك في الاختيار؟ أجب في جملتين فقط باللغة العربية بأسلوب راقٍ.`,
          { language: 'ar' }
        );
        if (!cancelled) {
          setReply(
            res.data?.response ||
            res.data?.message ||
            'اختيار موفق. ستجد في صفحة كل منتج تفاصيل دقيقة وتاريخ المؤجر لمساعدتك في اتخاذ القرار.'
          );
        }
      } catch {
        if (!cancelled) setReply('ستجد في صفحة كل منتج تفاصيل دقيقة وتاريخ المؤجر لمساعدتك في اتخاذ القرار.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchExplainer();
    return () => { cancelled = true; };
  }, [query]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex gap-4 items-start p-5 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 backdrop-blur-xl"
    >
      <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
        <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
          تحليل الذكاء الاصطناعي
          <span className="w-1 h-1 rounded-full bg-indigo-400" />
          مباشر
        </p>
        {loading ? (
          <div className="flex gap-1.5 items-center h-5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm md:text-base text-slate-100 dark:text-slate-200 leading-relaxed font-medium" style={{ direction: 'rtl' }}>
            {reply}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="إغلاق نصيحة المساعد"
        className="text-slate-500 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ── Main AI Search Page ───────────────────────────────────────────────────────
export default function AISearchPage() {
  const [input, setInput] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [showExplainer, setShowExplainer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['ai-search', committedQuery],
    queryFn: () => productsApi.search(committedQuery, {}, 1),
    enabled: committedQuery.length > 1,
    staleTime: 2 * 60 * 1000,
  });

  const products: Product[] = data?.data ?? [];

  const handleSearch = useCallback(() => {
    const q = input.trim();
    if (!q || q === committedQuery) return;
    setCommittedQuery(q);
    setShowExplainer(true);
    trackSearch(q);
  }, [input, committedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white" dir="rtl">
      {/* Hero */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-indigo-600/20 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-blue-500/15 blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-2xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold px-4 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            مدعوم بالذكاء الاصطناعي
          </div>

          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            ابحث بلغتك الطبيعية
          </h1>
          <p className="text-slate-400 text-base max-w-md mx-auto">
            اكتب ما تريد تأجيره كما تحدّثه — سيفهمك الذكاء الاصطناعي ويجد لك الأنسب.
          </p>

          {/* Search bar */}
          <div className="relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-indigo-400 transition-colors">
            <Search className="w-5 h-5 text-slate-400 flex-shrink-0" aria-hidden="true" />
            <label htmlFor="ai-search-input" className="sr-only">بحث بالذكاء الاصطناعي</label>
            <input
              id="ai-search-input"
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="مثلاً: فستان سهرة أنيق لحفلة عرس..."
              className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
              autoComplete="off"
              aria-label="ابحث بلغتك الطبيعية"
            />
            <button
              onClick={handleSearch}
              disabled={!input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-bold px-4 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
              aria-label="تنفيذ البحث"
            >
              بحث
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Quick chips */}
          {!committedQuery && (
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); setCommittedQuery(s); setShowExplainer(true); trackSearch(s); }}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-400 text-slate-300 hover:text-white transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-4 pb-16 space-y-8">
        <AnimatePresence mode="wait">
          {committedQuery && (
            <div key="explainer-space" className="space-y-6">
              {showExplainer && (
                <AIExplainer
                  query={committedQuery}
                  onDismiss={() => setShowExplainer(false)}
                />
              )}
              {products.length > 0 && <TrustScoreExplainer />}
            </div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {isFetching && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              <p className="text-sm font-mono tracking-widest text-indigo-400 uppercase animate-pulse">
                Sovereign Core: Indexing Results...
              </p>
            </div>
          </div>
        )}

        {/* Products grid */}
        {!isFetching && products.length > 0 && (
          <>
            <p className="text-sm text-slate-400">
              {products.length} نتيجة لـ «{committedQuery}»
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}

        {/* Empty */}
        {!isFetching && committedQuery && products.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 space-y-3 text-slate-400"
          >
            <Search className="w-12 h-12 mx-auto opacity-30" />
            <p className="text-base font-medium">لم نجد نتائج لـ «{committedQuery}»</p>
            <p className="text-sm">جرّب كلمات مختلفة أو اضغط على أحد الاقتراحات.</p>
          </motion.div>
        )}
      </section>
    </main>
  );
}
