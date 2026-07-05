"use client";

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-gray-200 dark:border-white/5 py-24 overflow-hidden bg-background dark:bg-[#020617]">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-t from-sovereign-gold/10 to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
          {/* 1. Brand Signature */}
          <div className="md:col-span-4">
            <Link href="/" className="inline-block mb-8 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-sovereign-gold to-sovereign-gold rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000" />
                <span className="relative text-5xl font-black tracking-tighter bg-gradient-to-r from-sovereign-gold via-sovereign-gold to-sovereign-gold dark:from-white dark:via-white dark:to-white/40 bg-clip-text text-transparent italic">
                  STANDARD.
                </span>
              </div>
            </Link>
            <p className="text-lg max-w-sm text-muted-foreground/60 leading-relaxed mb-8">
              منصة الكراء الفاخر والخدمات في الجزائر. 3 في 1: كراء، خدمات، وسوق مفتوح.
            </p>
            <div className="flex gap-6">
              {[
                { name: 'انستغرام', url: 'https://instagram.com/standardrent' },
                { name: 'تيك توك', url: 'https://tiktok.com/@standardrent' },
                { name: 'واتساب', url: 'https://wa.me/213000000000' },
              ].map((social) => (
                <a key={social.name} href={social.url} className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors border-b border-gray-200 dark:border-white/10 pb-1">
                  {social.name}
                </a>
              ))}
            </div>
          </div>

          {/* 2. الكراء (Rental) */}
          <div className="md:col-span-2 space-y-6">
            <span className="text-xs uppercase tracking-[0.2em] text-sovereign-gold font-black">الكراء</span>
            <ul className="space-y-4">
              {[
                { label: 'الكراء الفاخر', href: '/rentals' },
                { label: 'المنتجات', href: '/products' },
                { label: 'الحزم والعروض', href: '/bundles' },
                { label: 'السلة', href: '/cart' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-lg font-medium text-muted-foreground/60 hover:text-foreground dark:hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. الخدمات (Services) */}
          <div className="md:col-span-2 space-y-6">
            <span className="text-xs uppercase tracking-[0.2em] text-sovereign-gold font-black">الخدمات</span>
            <ul className="space-y-4">
              {[
                { label: 'خدمات المناسبات', href: '/services' },
                { label: 'البحث الذكي', href: '/ai-search' },
                { label: 'الحرفيات', href: '/artisans' },
                { label: 'التأمين', href: '/insurance' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-lg font-medium text-muted-foreground/60 hover:text-foreground dark:hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. السوق + الدعم */}
          <div className="md:col-span-2 space-y-6">
            <span className="text-xs uppercase tracking-[0.2em] text-sovereign-gold font-black">السوق والدعم</span>
            <ul className="space-y-4">
              {[
                { label: 'السوق المفتوح', href: '/marketplace' },
                { label: 'البائعون', href: '/vendors' },
                { label: 'المحفظة', href: '/wallet' },
                { label: 'الاشتراكات', href: '/subscriptions' },
                { label: 'نقاط الثقة', href: '/trust-score' },
                { label: 'السجل القضائي', href: '/judicial' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-lg font-medium text-muted-foreground/60 hover:text-foreground dark:hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 5. الأخرى */}
          <div className="md:col-span-2 space-y-6">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-black">أخرى</span>
            <ul className="space-y-4">
              {[
                { label: 'المدونة', href: '/blog' },
                { label: 'عن ستاندرد', href: '/about' },
                { label: 'الأسئلة الشائعة', href: '/faq' },
                { label: 'المرتجعات', href: '/returns' },
                { label: 'التحقق', href: '/verification' },
                { label: 'المحفظة', href: '/wallet' },
                { label: 'الاشتراكات', href: '/subscriptions' },
                { label: 'التحويلات', href: '/wallet' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-lg font-medium text-muted-foreground/60 hover:text-foreground dark:hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Signature */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-gray-200 dark:border-white/5 gap-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground/40 font-bold">© 2026 STANDARD.Rent — الجزائر</p>
          <div className="flex gap-4 items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground/40 font-bold">كراء فاخر · خدمات · سوق مفتوح</p>
          </div>
        </div>
      </div>
    </footer>
  );
}