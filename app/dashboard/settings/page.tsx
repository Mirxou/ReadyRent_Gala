'use client';

import { useState } from 'react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Settings, User, Bell, Shield, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const algerianCities = [
  'الجزائر العاصمة',
  'وهران',
  'قسنطينة',
  'عنابة',
  'باتنة',
  'سطيف',
  'البليدة',
  'تلمسان',
  'بجاية',
  'تيزي وزو',
  'المسيلة',
  'بئر مراد رايس',
];

const notificationToggles = [
  { id: 'email', label: 'إشعارات البريد الإلكتروني', desc: 'استلام إشعارات عبر البريد الإلكتروني' },
  { id: 'sms', label: 'إشعارات الرسائل القصيرة', desc: 'استلام إشعارات عبر SMS' },
  { id: 'push', label: 'الإشعارات الفورية', desc: 'إشعارات في الوقت الحقيقي في المتصفح' },
  { id: 'bookings', label: 'تحديثات الحجوزات', desc: 'إشعارات حالة الحجز والتسليم' },
  { id: 'promo', label: 'العروض الترويجية', desc: 'أحدث العروض والخصومات' },
];

export default function SettingsPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('profile');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    name: 'مستخدم سيادي',
    email: 'user@standard.dz',
    phone: '0770 123 456',
    city: 'الجزائر العاصمة',
    bio: '',
  });

  // Notifications state
  const [notifSettings, setNotifSettings] = useState({
    email: true,
    sms: false,
    push: true,
    bookings: true,
    promo: false,
  });

  // Security state
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Appearance state
  const [appearanceData, setAppearanceData] = useState({
    theme: 'dark',
    language: 'ar',
  });

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const handleSaveProfile = () => {
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      toast.success('تم حفظ التغييرات بنجاح');
    }, 1000);
  };

  const handleSaveNotifs = () => {
    setSavingNotifs(true);
    setTimeout(() => {
      setSavingNotifs(false);
      toast.success('تم حفظ تفضيلات الإشعارات بنجاح');
    }, 1000);
  };

  const handleChangePassword = () => {
    if (!securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    setSavingSecurity(true);
    setTimeout(() => {
      setSavingSecurity(false);
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('تم تغيير كلمة المرور بنجاح');
    }, 1000);
  };

  const handleEnable2FA = () => {
    toast.success('تم إرسال رمز التفعيل');
  };

  const handleSaveAppearance = () => {
    setSavingAppearance(true);
    setTimeout(() => {
      setSavingAppearance(false);
      toast.success('تم حفظ تفضيلات المظهر بنجاح');
    }, 1000);
  };

  const sections = [
    { id: 'profile', icon: User, title: 'الملف الشخصي', desc: 'تعديل اسمك وصورك ومعلوماتك الشخصية' },
    { id: 'notifications', icon: Bell, title: 'الإشعارات', desc: 'إدارة تفضيلات الإشعارات والبريد الإلكتروني' },
    { id: 'security', icon: Shield, title: 'الأمان والخصوصية', desc: 'كلمة المرور، المصادقة الثنائية، الجلسات النشطة' },
    { id: 'appearance', icon: Palette, title: 'المظهر', desc: 'الوضع الداكن/الفاتح، حجم الخط، اللغة' },
  ];

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
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassPanel className="overflow-hidden !p-0" variant="default">
                  {/* Section Header - Clickable */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full p-6 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-right"
                  >
                    <Icon className="w-5 h-5 text-sovereign-gold/60 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-bold text-white/90">{section.title}</h3>
                      <p className="text-xs text-white/40 mt-1">{section.desc}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-white/40" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/40" />
                    )}
                  </button>

                  {/* Section Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-2 border-t border-white/5">
                          {/* Profile Section */}
                          {section.id === 'profile' && (
                            <div className="space-y-5 mt-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                  <Label className="text-white/70 text-sm">الاسم الكامل</Label>
                                  <Input
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-white/70 text-sm">البريد الإلكتروني</Label>
                                  <Input
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                    dir="ltr"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                  <Label className="text-white/70 text-sm">رقم الهاتف</Label>
                                  <Input
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                    dir="ltr"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-white/70 text-sm">المدينة</Label>
                                  <select
                                    value={profileData.city}
                                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                                    className="w-full h-10 rounded-md border border-white/10 bg-white/5 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sovereign-gold/50"
                                  >
                                    {algerianCities.map((city) => (
                                      <option key={city} value={city} className="bg-sovereign-obsidian text-white">
                                        {city}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-white/70 text-sm">نبذة عنك</Label>
                                <Textarea
                                  value={profileData.bio}
                                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                  placeholder="أخبرنا عن نفسك..."
                                  className="bg-white/5 border-white/10 text-white min-h-[80px]"
                                />
                              </div>

                              <div className="flex justify-start pt-2">
                                <SovereignButton
                                  variant="primary"
                                  onClick={handleSaveProfile}
                                  isLoading={savingProfile}
                                >
                                  {savingProfile ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                                </SovereignButton>
                              </div>
                            </div>
                          )}

                          {/* Notifications Section */}
                          {section.id === 'notifications' && (
                            <div className="space-y-4 mt-4">
                              {notificationToggles.map((toggle) => (
                                <div
                                  key={toggle.id}
                                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                                >
                                  <div>
                                    <p className="text-sm font-bold text-white/90">{toggle.label}</p>
                                    <p className="text-xs text-white/40 mt-0.5">{toggle.desc}</p>
                                  </div>
                                  <Switch
                                    checked={notifSettings[toggle.id as keyof typeof notifSettings]}
                                    onCheckedChange={(checked) =>
                                      setNotifSettings({ ...notifSettings, [toggle.id]: checked })
                                    }
                                  />
                                </div>
                              ))}

                              <div className="flex justify-start pt-2">
                                <SovereignButton
                                  variant="primary"
                                  onClick={handleSaveNotifs}
                                  isLoading={savingNotifs}
                                >
                                  {savingNotifs ? 'جارٍ الحفظ...' : 'حفظ التفضيلات'}
                                </SovereignButton>
                              </div>
                            </div>
                          )}

                          {/* Security Section */}
                          {section.id === 'security' && (
                            <div className="space-y-5 mt-4">
                              <div className="space-y-2">
                                <Label className="text-white/70 text-sm">كلمة المرور الحالية</Label>
                                <Input
                                  type="password"
                                  value={securityData.currentPassword}
                                  onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                                  placeholder="••••••••"
                                  className="bg-white/5 border-white/10 text-white"
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                  <Label className="text-white/70 text-sm">كلمة المرور الجديدة</Label>
                                  <Input
                                    type="password"
                                    value={securityData.newPassword}
                                    onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                    placeholder="••••••••"
                                    className="bg-white/5 border-white/10 text-white"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-white/70 text-sm">تأكيد كلمة المرور الجديدة</Label>
                                  <Input
                                    type="password"
                                    value={securityData.confirmPassword}
                                    onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                    placeholder="••••••••"
                                    className="bg-white/5 border-white/10 text-white"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-3 pt-2">
                                <SovereignButton
                                  variant="primary"
                                  onClick={handleChangePassword}
                                  isLoading={savingSecurity}
                                >
                                  {savingSecurity ? 'جارٍ التغيير...' : 'تغيير كلمة المرور'}
                                </SovereignButton>
                                <SovereignButton
                                  variant="secondary"
                                  onClick={handleEnable2FA}
                                >
                                  تفعيل المصادقة الثنائية
                                </SovereignButton>
                              </div>
                            </div>
                          )}

                          {/* Appearance Section */}
                          {section.id === 'appearance' && (
                            <div className="space-y-6 mt-4">
                              <div className="space-y-3">
                                <Label className="text-white/70 text-sm font-bold">المظهر</Label>
                                <div className="flex gap-4">
                                  {[
                                    { value: 'light', label: 'فاتح' },
                                    { value: 'dark', label: 'داكن' },
                                  ].map((opt) => (
                                    <label
                                      key={opt.value}
                                      className={`flex items-center gap-3 px-5 py-3 rounded-2xl border cursor-pointer transition-all ${
                                        appearanceData.theme === opt.value
                                          ? 'border-sovereign-gold/50 bg-sovereign-gold/10'
                                          : 'border-white/10 bg-white/5 hover:border-white/20'
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name="theme"
                                        value={opt.value}
                                        checked={appearanceData.theme === opt.value}
                                        onChange={(e) => setAppearanceData({ ...appearanceData, theme: e.target.value })}
                                        className="sr-only"
                                      />
                                      <div
                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                          appearanceData.theme === opt.value
                                            ? 'border-sovereign-gold'
                                            : 'border-white/30'
                                        }`}
                                      >
                                        {appearanceData.theme === opt.value && (
                                          <div className="w-2 h-2 rounded-full bg-sovereign-gold" />
                                        )}
                                      </div>
                                      <span className="text-sm font-bold text-white/90">{opt.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <Label className="text-white/70 text-sm font-bold">اللغة</Label>
                                <div className="flex gap-4">
                                  {[
                                    { value: 'ar', label: 'العربية' },
                                    { value: 'fr', label: 'الفرنسية' },
                                  ].map((opt) => (
                                    <label
                                      key={opt.value}
                                      className={`flex items-center gap-3 px-5 py-3 rounded-2xl border cursor-pointer transition-all ${
                                        appearanceData.language === opt.value
                                          ? 'border-sovereign-gold/50 bg-sovereign-gold/10'
                                          : 'border-white/10 bg-white/5 hover:border-white/20'
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name="language"
                                        value={opt.value}
                                        checked={appearanceData.language === opt.value}
                                        onChange={(e) => setAppearanceData({ ...appearanceData, language: e.target.value })}
                                        className="sr-only"
                                      />
                                      <div
                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                          appearanceData.language === opt.value
                                            ? 'border-sovereign-gold'
                                            : 'border-white/30'
                                        }`}
                                      >
                                        {appearanceData.language === opt.value && (
                                          <div className="w-2 h-2 rounded-full bg-sovereign-gold" />
                                        )}
                                      </div>
                                      <span className="text-sm font-bold text-white/90">{opt.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              <div className="flex justify-start pt-2">
                                <SovereignButton
                                  variant="primary"
                                  onClick={handleSaveAppearance}
                                  isLoading={savingAppearance}
                                >
                                  {savingAppearance ? 'جارٍ الحفظ...' : 'حفظ التفضيلات'}
                                </SovereignButton>
                              </div>
                            </div>
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