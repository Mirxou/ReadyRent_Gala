'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi, sovereignClient } from '@/lib/api';
import {
  defaultProfileData, defaultNotifSettings, defaultSecurityData, defaultAppearanceData
} from './data';

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

export interface FormState {
  profile: typeof defaultProfileData;
  notifs: typeof defaultNotifSettings;
  security: typeof defaultSecurityData;
  appearance: typeof defaultAppearanceData;
}

function _updater<T>(key: keyof FormState) {
  return (next: T | ((prev: T) => T)) => {
    return (prev: FormState) => ({
      ...prev,
      [key]: typeof next === 'function' ? (next as (p: T) => T)(prev[key]) : next,
    });
  };
}

export function useSettingsForm() {
  const queryClient = useQueryClient();
  const [expandedSection, setExpandedSection] = useState<string | null>('profile');

  const { data: profileResponse, isLoading: isProfileLoading, isError } = useQuery<ProfileApiResponse>({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      const res = await authApi.getProfile();
      if (res.status === 'sovereign_halt') throw new Error('فشل في تحميل الملف الشخصي');
      return { user: res.data as ProfileApiResponse['user'] };
    },
  });

  const apiUser = profileResponse?.user;
  const [formState, setFormState] = useState<FormState>({
    profile: defaultProfileData,
    notifs: defaultNotifSettings,
    security: defaultSecurityData,
    appearance: defaultAppearanceData,
  });
  const initialisedRef = useRef(false);

  useEffect(() => {
    if (!apiUser || initialisedRef.current) return;
    initialisedRef.current = true;
    const userName = apiUser.first_name && apiUser.last_name
      ? `${apiUser.first_name} ${apiUser.last_name}`
      : apiUser.username || defaultProfileData.name;
     
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

  const setProfileData = (next: typeof defaultProfileData | ((prev: typeof defaultProfileData) => typeof defaultProfileData)) =>
    setFormState((prev) => ({ ...prev, profile: typeof next === 'function' ? (next as (p: typeof defaultProfileData) => typeof defaultProfileData)(prev.profile) : next }));

  const setNotifSettings = (next: typeof defaultNotifSettings | ((prev: typeof defaultNotifSettings) => typeof defaultNotifSettings)) =>
    setFormState((prev) => ({ ...prev, notifs: typeof next === 'function' ? (next as (p: typeof defaultNotifSettings) => typeof defaultNotifSettings)(prev.notifs) : next }));

  const setSecurityData = (next: typeof defaultSecurityData | ((prev: typeof defaultSecurityData) => typeof defaultSecurityData)) =>
    setFormState((prev) => ({ ...prev, security: typeof next === 'function' ? (next as (p: typeof defaultSecurityData) => typeof defaultSecurityData)(prev.security) : next }));

  const setAppearanceData = (next: typeof defaultAppearanceData | ((prev: typeof defaultAppearanceData) => typeof defaultAppearanceData)) =>
    setFormState((prev) => ({ ...prev, appearance: typeof next === 'function' ? (next as (p: typeof defaultAppearanceData) => typeof defaultAppearanceData)(prev.appearance) : next }));

  const saveProfileMutation = useMutation({
    mutationFn: async (data: typeof defaultProfileData) => {
      const res = await sovereignClient.patch('/auth/profile/', { name: data.name, email: data.email, phone: data.phone, city: data.city, bio: data.bio });
      if (res.status === 'sovereign_halt') throw new Error('فشل');
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] }); toast.success('تم حفظ التغييرات بنجاح'); },
    onError: () => { toast.error('فشل في حفظ التغييرات، يرجى المحاولة لاحقاً'); },
  });

  const saveNotifsMutation = useMutation({
    mutationFn: async (prefs: typeof defaultNotifSettings) => {
      const res = await sovereignClient.post('/auth/profile/', { notification_preferences: prefs });
      if (res.status === 'sovereign_halt') throw new Error('فشل');
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] }); toast.success('تم حفظ تفضيلات الإشعارات بنجاح'); },
    onError: () => { toast.error('فشل في حفظ تفضيلات الإشعارات، يرجى المحاولة لاحقاً'); },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await sovereignClient.post('/auth/change-password/', { current_password: data.currentPassword, new_password: data.newPassword });
      if (res.status === 'sovereign_halt') throw new Error('فشل');
      return res.data;
    },
    onSuccess: () => { setSecurityData(defaultSecurityData); toast.success('تم تغيير كلمة المرور بنجاح'); },
    onError: () => { toast.error('فشل في تغيير كلمة المرور، يرجى التحقق من كلمة المرور الحالية'); },
  });

  const saveAppearanceMutation = useMutation({
    mutationFn: async (data: typeof defaultAppearanceData) => {
      const res = await sovereignClient.post('/auth/profile/', { theme: data.theme, language: data.language });
      if (res.status === 'sovereign_halt') throw new Error('فشل');
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] }); toast.success('تم حفظ تفضيلات المظهر بنجاح'); },
    onError: () => { toast.error('فشل في حفظ تفضيلات المظهر، يرجى المحاولة لاحقاً'); },
  });

  const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);

  const handleChangePassword = () => {
    const s = formState.security;
    if (!s.currentPassword || !s.newPassword || !s.confirmPassword) { toast.error('يرجى ملء جميع الحقول'); return; }
    if (s.newPassword !== s.confirmPassword) { toast.error('كلمة المرور الجديدة غير متطابقة'); return; }
    changePasswordMutation.mutate({ currentPassword: s.currentPassword, newPassword: s.newPassword });
  };

  const handleEnable2FA = () => toast.success('تم إرسال رمز التفعيل');

  return {
    expandedSection, toggleSection,
    formState, setProfileData, setNotifSettings, setSecurityData, setAppearanceData,
    isProfileLoading, isError, queryClient,
    saveProfileMutation, saveNotifsMutation, changePasswordMutation, saveAppearanceMutation,
    handleChangePassword, handleEnable2FA,
  };
}
