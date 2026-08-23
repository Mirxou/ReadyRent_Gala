export const algerianCities = [
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

export const notificationToggles = [
  { id: 'email', label: 'إشعارات البريد الإلكتروني', desc: 'استلام إشعارات عبر البريد الإلكتروني' },
  { id: 'sms', label: 'إشعارات الرسائل القصيرة', desc: 'استلام إشعارات عبر SMS' },
  { id: 'push', label: 'الإشعارات الفورية', desc: 'إشعارات في الوقت الحقيقي في المتصفح' },
  { id: 'bookings', label: 'تحديثات الحجوزات', desc: 'إشعارات حالة الحجز والتسليم' },
  { id: 'promo', label: 'العروض الترويجية', desc: 'أحدث العروض والخصومات' },
];

export const defaultProfileData = { name: '', email: '', phone: '', city: 'الجزائر العاصمة', bio: '' };
export const defaultNotifSettings = { email: true, sms: false, push: true, bookings: true, promo: false };
export const defaultSecurityData = { currentPassword: '', newPassword: '', confirmPassword: '' };
export const defaultAppearanceData = { theme: 'dark' as string, language: 'ar' as string };
