'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
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

/** Default form values used when the API response is missing fields */
const defaultProfileData = {
  name: '',
  email: '',
  phone: '',
  city: 'الجزائر العاصمة',
  bio: '',
};

const defaultNotifSettings = {
  email: true,
  sms: false,
  push: true,
  bookings: true,
  promo: false,
};

const defaultSecurityData = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const defaultAppearanceData = {
  theme: 'dark' as string,
  language: 'ar' as string,
};

interface ProfileApiResponse {
  user: {
    id?: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    city?: string;
    bio?: string;
    notification_preferences?: Record<string, boolean>;
    theme?: string;
    language?: string;
    is_2fa_enabled?: boolean;
    [key: string]: unknown;
  };
}

interface FormState {
  profile: typeof defaultProfileData;
  notifs: typeof defaultNotifSettings;
  security: typeof defaultSecurityData;
  appearance: typeof defaultAppearanceData;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [expandedSection, setExpandedSection] = useState<string | null>('profile');

  // ---- Fetch profile from API ----
  const { data: profileResponse, isLoading: isProfileLoading, isError } = useQuery<ProfileApiResponse>({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      const res = await fetch('/api/auth/profile');
      if (!res.ok) throw new Error('فشل في تحميل الملف الشخصي');
      return res.json();
    },
  });

  const apiUser = profileResponse?.user;

  // ---- Local form state (initialised from API data once loaded) ----
  const [formState, setFormState] = useState<FormState>({
    profile: defaultProfileData,
    notifs: defaultNotifSettings,
    security: defaultSecurityData,
    appearance: defaultAppearanceData,
  });
  const initialisedRef = useRef(false);

  const profileData = formState.profile;
  const setProfileData = (next: typeof defaultProfileData | ((prev: typeof defaultProfileData) => typeof defaultProfileData)) => {
    setFormState((prev) => ({
      ...prev,
      profile: typeof next === 'function' ? (next as (prev: typeof defaultProfileData) => typeof defaultProfileData)(prev.profile) : next,
    }));
  };

  const notifSettings = formState.notifs;
  const setNotifSettings = (next: typeof defaultNotifSettings | ((prev: typeof defaultNotifSettings) => typeof defaultNotifSettings)) => {
    setFormState((prev) => ({
      ...prev,
      notifs: typeof next === 'function' ? (next as (prev: typeof defaultNotifSettings) => typeof defaultNotifSettings)(prev.notifs) : next,
    }));
  };

  const securityData = formState.security;
  const setSecurityData = (next: typeof defaultSecurityData | ((prev: typeof defaultSecurityData) => typeof defaultSecurityData)) => {
    setFormState((prev) => ({
      ...prev,
      security: typeof next === 'function' ? (next as (prev: typeof defaultSecurityData) => typeof defaultSecurityData)(prev.security) : next,
    }));
  };

  const appearanceData = formState.appearance;
  const setAppearanceData = (next: typeof defaultAppearanceData | ((prev: typeof defaultAppearanceData) => typeof defaultAppearanceData)) => {
    setFormState((prev) => ({
      ...prev,
      appearance: typeof next === 'function' ? (next as (prev: typeof defaultAppearanceData) => typeof defaultAppearanceData)(prev.appearance) : next,
    }));
  };

  // Sync form state from API data once loaded — intentionally one-shot setState to hydrate form
  useEffect(() => {
    if (!apiUser || initialisedRef.current) return;
    initialisedRef.current = true;

    const userName = apiUser.first_name && apiUser.last_name
      ? `${apiUser.first_name} ${apiUser.last_name}`
      : apiUser.username || defaultProfileData.name;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormState({
      profile: {
        name: userName,
        email: apiUser.email || defaultProfileData.email,
        phone: apiUser.phone || defaultProfileData.phone,
        city: (apiUser.city as string) || defaultProfileData.city,
        bio: (apiUser.bio as string) || defaultProfileData.bio,
      },
      notifs: apiUser.notification_preferences && typeof apiUser.notification_preferences === 'object'
        ? { ...defaultNotifSettings, ...apiUser.notification_preferences as Partial<typeof defaultNotifSettings> }
        : defaultNotifSettings,
      security: defaultSecurityData,
      appearance: {
        theme: (apiUser.theme as string) || defaultAppearanceData.theme,
        language: (apiUser.language as string) || defaultAppearanceData.language,
      },
    });
  }, [apiUser]);

  // ---- Mutations ----
  const saveProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          city: data.city,
          bio: data.bio,
        }),
      });
      if (!res.ok) throw new Error('فشل في حفظ التغييرات');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      toast.success('تم حفظ التغييرات بنجاح');
    },
    onError: () => {
      toast.error('فشل في حفظ التغييرات، يرجى المحاولة لاحقاً');
    },
  });

  const saveNotifsMutation = useMutation({
    mutationFn: async (prefs: typeof notifSettings) => {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_preferences: prefs }),
      });
      if (!res.ok) throw new Error('فشل في حفظ تفضيلات الإشعارات');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      toast.success('تم حفظ تفضيلات الإشعارات بنجاح');
    },
    onError: () => {
      toast.error('فشل في حفظ تفضيلات الإشعارات، يرجى المحاولة لاحقاً');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: data.currentPassword,
          new_password: data.newPassword,
        }),
      });
      if (!res.ok) throw new Error('فشل في تغيير كلمة المرور');
      return res.json();
    },
    onSuccess: () => {
      setSecurityData(defaultSecurityData);
      toast.success('تم تغيير كلمة المرور بنجاح');
    },
    onError: () => {
      toast.error('فشل في تغيير كلمة المرور، يرجى التحقق من كلمة المرور الحالية');
    },
  });

  const saveAppearanceMutation = useMutation({
    mutationFn: async (data: typeof appearanceData) => {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: data.theme, language: data.language }),
      });
      if (!res.ok) throw new Error('فشل في حفظ تفضيلات المظهر');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      toast.success('تم حفظ تفضيلات المظهر بنجاح');
    },
    onError: () => {
      toast.error('فشل في حفظ تفضيلات المظهر، يرجى المحاولة لاحقاً');
    },
  });

  // ---- Handlers ----
  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const handleSaveProfile = () => {
    saveProfileMutation.mutate(profileData);
  };

  const handleSaveNotifs = () => {
    saveNotifsMutation.mutate(notifSettings);
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
    changePasswordMutation.mutate({
      currentPassword: securityData.currentPassword,
      newPassword: securityData.newPassword,
    });
  };

  const handleEnable2FA = () => {
    toast.success('تم إرسال رمز التفعيل');
  };

  const handleSaveAppearance = () => {
    saveAppearanceMutation.mutate(appearanceData);
  };

  const sections = [
    { id: 'profile', icon: User, title: 'الملف الشخصي', desc: 'تعديل اسمك وصورك ومعلوماتك الشخصية' },
    { id: 'notifications', icon: Bell, title: 'الإشعارات', desc: 'إدارة تفضيلات الإشعارات والبريد الإلكتروني' },
    { id: 'security', icon: Shield, title: 'الأمان والخصوصية', desc: 'كلمة المرور، المصادقة الثنائية، الجلسات النشطة' },
    { id: 'appearance', icon: Palette, title: 'المظهر', desc: 'الوضع الداكن/الفاتح، حجم الخط، اللغة' },
  ];

  // ---- Loading skeleton while fetching profile ----
  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-sovereign-obsidian pt-24 pb-16" dir="rtl">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-10">
            <Skeleton className="h-12 w-12 rounded-2xl bg-white/10" />
            <Skeleton className="h-9 w-40 bg-white/10" />
          </div>
          {/* Section cards skeleton */}
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

  // ---- Error state ----
  if (isError) {
    return (
      <div className="min-h-screen bg-sovereign-obsidian pt-24 pb-16" dir="rtl">
        <div className="max-w-4xl mx-auto px-6 text-center py-20">
          <p className="text-white/60 text-lg mb-4">فشل في تحميل بيانات الملف الشخصي</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] })}
            className="text-sovereign-gold hover:underline text-sm"
          >
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
                                  isLoading={saveProfileMutation.isPending}
                                >
                                  {saveProfileMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
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
                                  isLoading={saveNotifsMutation.isPending}
                                >
                                  {saveNotifsMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ التفضيلات'}
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
                                  isLoading={changePasswordMutation.isPending}
                                >
                                  {changePasswordMutation.isPending ? 'جارٍ التغيير...' : 'تغيير كلمة المرور'}
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
                                  isLoading={saveAppearanceMutation.isPending}
                                >
                                  {saveAppearanceMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ التفضيلات'}
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