"use client";

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-gray-200 dark:border-white/5 py-24 overflow-hidden bg-background dark:bg-[#020617]">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-t from-gala-purple/10 to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
          {/* 1. Brand Signature */}
          <div className="md:col-span-6">
            <Link href="/" className="inline-block mb-12 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-gala-purple to-gala-pink rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <span className="relative text-5xl font-black tracking-tighter bg-gradient-to-r from-gala-purple via-gala-pink to-gala-gold dark:from-white dark:via-white dark:to-white/40 bg-clip-text text-transparent italic">
                  GALA.
                </span>
              </div>
            </Link>
            <p className="text-2xl font-medium max-w-md text-muted-foreground/60 leading-relaxed mb-12">
              فن الاحتفال، <br />
              في قلب قسنطينة والجزائر.
            </p>
            <div className="flex gap-6">
              {['Insta', 'TikTok', 'WhatsApp'].map((social) => (
                <a key={social} href="#" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors border-b border-gray-200 dark:border-white/10 pb-1">
                  {social}
                </a>
              ))}
            </div>
          </div>

          {/* 2. Navigation Links */}
          <div className="md:col-span-3 space-y-8">
            <span className="text-xs uppercase tracking-[0.2em] text-gala-purple font-black">القائمة</span>
            <ul className="space-y-6">
              {[
                { label: 'المنتجات', href: '/products' },
                { label: 'الحزم', href: '/bundles' },
                { label: 'دليل المناسبات', href: '/local-guide' },
                { label: 'الحرفيات', href: '/artisans' },
                { label: 'المدونة', href: '/blog' },
                { label: 'الأسئلة الشائعة', href: '/faq' },
                { label: 'عن غالا', href: '/about' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-3xl font-bold text-foreground dark:text-white/90 hover:text-gala-pink dark:hover:text-gala-pink transition-all flex items-center group w-fit">
                    {item.label}
                    <ArrowUpRight className="w-6 h-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500 text-gala-pink ml-2" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Support & Legal */}
          <div className="md:col-span-3 space-y-8">
            <span className="text-xs uppercase tracking-[0.2em] text-gala-pink font-black">للتواصل</span>
            <ul className="space-y-4 text-xl font-medium text-muted-foreground/60">
              <li>
                <Link href="/faq" className="hover:text-foreground dark:hover:text-white transition-colors">
                  الأسئلة الشائعة
                </Link>
              </li>
              <li>
                <Link href="/disputes" className="hover:text-foreground dark:hover:text-white transition-colors">
                  الدعم الفني
                </Link>
              </li>
              <li>
                <Link href="/pages/terms" className="hover:text-foreground dark:hover:text-white transition-colors">
                  الشروط و الأحكام
                </Link>
              </li>
              <li>
                <Link href="/pages/privacy" className="hover:text-foreground dark:hover:text-white transition-colors">
                  سياسة الخصوصية
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 4. Bottom Signature */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-gray-200 dark:border-white/5 gap-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground/40 font-bold">© 2026 ReadyRent Gala</p>
          <div className="flex gap-4 items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground/40 font-bold">Designed for the future</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
