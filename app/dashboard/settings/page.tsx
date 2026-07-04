'use client';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { Settings, User, Bell, Shield, Palette } from 'lucide-react';
import { motion } from 'framer-motion';

const settingSections = [
  { icon: User, title: 'الملف الشخصي', desc: 'تعديل اسمك وصورك ومعلوماتك الشخصية' },
  { icon: Bell, title: 'الإشعارات', desc: 'إدارة تفضيلات الإشعارات والبريد الإلكتروني' },
  { icon: Shield, title: 'الأمان والخصوصية', desc: 'كلمة المرور، المصادقة الثنائية، الجلسات النشطة' },
  { icon: Palette, title: 'المظهر', desc: 'الوضع الداكن/الفاتح، حجم الخط، اللغة' },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-sovereign-obsidian pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-sovereign-gold/10 rounded-2xl border border-sovereign-gold/20">
            <Settings className="w-6 h-6 text-sovereign-gold" />
          </div>
          <h1 className="text-3xl font-black italic">الإعدادات</h1>
        </div>
        <div className="grid gap-4">
          {settingSections.map((section, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <GlassPanel className="p-6 group hover:bg-white/[0.02] transition-colors cursor-pointer" variant="default">
                <div className="flex items-center gap-4">
                  <section.icon className="w-5 h-5 text-sovereign-gold/60" />
                  <div className="flex-1">
                    <h3 className="font-bold text-white/90">{section.title}</h3>
                    <p className="text-xs text-white/40 mt-1">{section.desc}</p>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}