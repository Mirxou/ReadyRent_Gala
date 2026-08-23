import { PartyPopper, Camera, Palette, Music, Flower2, Sparkles } from 'lucide-react';
import type { Variants } from 'framer-motion';

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  }),
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export const serviceCategories = [
  { icon: PartyPopper, name: 'أعراس', desc: 'قاعات وتنظيم أفراح', slug: 'weddings', categoryMatch: ['أماكن أعراس', 'سيارات أعراس'], gradient: 'from-rose-500/15 to-rose-500/5' },
  { icon: Camera, name: 'تصوير', desc: 'مصورون محترفون', slug: 'photography', categoryMatch: ['مصورين'], gradient: 'from-blue-500/15 to-blue-500/5' },
  { icon: Palette, name: 'مكياج', desc: 'مجمّلات أزياء محترفات', slug: 'makeup', categoryMatch: ['مكياج'], gradient: 'from-pink-500/15 to-pink-500/5' },
  { icon: Music, name: 'دج', desc: 'دي جي لموسيقى لا تُنسى', slug: 'dj', categoryMatch: ['دج'], gradient: 'from-amber-500/15 to-amber-500/5' },
  { icon: Flower2, name: 'زهور', desc: 'تنسيق زهور فاخر', slug: 'flowers', categoryMatch: ['زهور'], gradient: 'from-emerald-500/15 to-emerald-500/5' },
  { icon: Sparkles, name: 'حفلات', desc: 'تنظيم حفلات شاملة', slug: 'parties', categoryMatch: ['تنسيق حفلات', 'طباخين'], gradient: 'from-violet-500/15 to-violet-500/5' },
];
