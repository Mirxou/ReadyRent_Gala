'use client';

import { Settings, User, Bell, Shield, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsForm } from './_components/use-settings-form';
import { ProfileSection, NotificationsSection, SecuritySection, AppearanceSection } from './_components/sections';

const sections = [
  { id: 'profile', icon: User, title: 'الملف الشخصي', desc: 'تعديل اسمك وصورك ومعلوماتك الشخصية' },
  { id: 'notifications', icon: Bell, title: 'الإشعارات', desc: 'إدارة تفضيلات الإشعارات والبريد الإلكتروني' },
  { id: 'security', icon: Shield, title: 'الأمان والخصوصية', desc: 'كلمة المرور، المصادقة الثنائية، الجلسات النشطة' },
  { id: 'appearance', icon: Palette, title: 'المظهر', desc: 'الوضع الداكن/الفاتح، حجم الخط، اللغة' },
];

export default function SettingsPage() {
  const {
    expandedSection, toggleSection,
    formState, setProfileData, setNotifSettings, setSecurityData, setAppearanceData,
    isProfileLoading, isError, queryClient,
    saveProfileMutation, saveNotifsMutation, changePasswordMutation, saveAppearanceMutation,
    handleChangePassword, handleEnable2FA,
  } = useSettingsForm();

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-sovereign-obsidian pt-24 pb-16" dir="rtl">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-10">
            <Skeleton className="h-12 w-12 rounded-2xl bg-white/10" />
            <Skeleton className="h-9 w-40 bg-white/10" />
          </div>
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5 rounded bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-36 bg-white/10" />
                    <Skeleton className="h-3 w-60 bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-sovereign-obsidian pt-24 pb-16" dir="rtl">
        <div className="max-w-4xl mx-auto px-6 text-center py-20">
          <p className="text-white/60 text-lg mb-4">فشل في تحميل بيانات الملف الشخصي</p>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] })} className="text-sovereign-gold hover:underline text-sm">
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sovereign-obsidian pt-24 pb-16" dir="rtl">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-sovereign-gold/10 rounded-2xl border border-sovereign-gold/20">
            <Settings className="w-6 h-6 text-sovereign-gold" />
          </div>
          <h1 className="text-3xl font-black italic">الإعدادات</h1>
        </div>
        <div className="grid gap-4">
          {sections.map((section, i) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;
            return (
              <motion.div key={section.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <GlassPanel className="overflow-hidden !p-0" variant="default">
                  <button onClick={() => toggleSection(section.id)} className="w-full p-6 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-right">
                    <Icon className="w-5 h-5 text-sovereign-gold/60 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-bold text-white/90">{section.title}</h3>
                      <p className="text-xs text-white/40 mt-1">{section.desc}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }} className="overflow-hidden">
                        <div className="px-6 pb-6 pt-2 border-t border-white/5">
                          {section.id === 'profile' && (
                            <ProfileSection data={formState.profile} set={setProfileData} isPending={saveProfileMutation.isPending} onSave={() => saveProfileMutation.mutate(formState.profile)} />
                          )}
                          {section.id === 'notifications' && (
                            <NotificationsSection data={formState.notifs} set={setNotifSettings} isPending={saveNotifsMutation.isPending} onSave={() => saveNotifsMutation.mutate(formState.notifs)} />
                          )}
                          {section.id === 'security' && (
                            <SecuritySection data={formState.security} set={setSecurityData} isPending={changePasswordMutation.isPending} onChangePassword={handleChangePassword} onEnable2FA={handleEnable2FA} />
                          )}
                          {section.id === 'appearance' && (
                            <AppearanceSection data={formState.appearance} set={setAppearanceData} isPending={saveAppearanceMutation.isPending} onSave={() => saveAppearanceMutation.mutate(formState.appearance)} />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
