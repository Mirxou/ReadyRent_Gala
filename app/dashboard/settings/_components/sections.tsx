'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { algerianCities, notificationToggles } from './data';

export function ProfileSection({ data, set, isPending, onSave }: {
  data: { name: string; email: string; phone: string; city: string; bio: string };
  set: (next: { name: string; email: string; phone: string; city: string; bio: string } | ((prev: { name: string; email: string; phone: string; city: string; bio: string }) => { name: string; email: string; phone: string; city: string; bio: string })) => void;
  isPending: boolean;
  onSave: () => void;
}) {
  return (
    <div className="space-y-5 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-white/70 text-sm">الاسم الكامل</Label>
          <Input value={data.name} onChange={(e) => set({ ...data, name: e.target.value })} className="bg-white/5 border-white/10 text-white" />
        </div>
        <div className="space-y-2">
          <Label className="text-white/70 text-sm">البريد الإلكتروني</Label>
          <Input type="email" value={data.email} onChange={(e) => set({ ...data, email: e.target.value })} className="bg-white/5 border-white/10 text-white" dir="ltr" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-white/70 text-sm">رقم الهاتف</Label>
          <Input value={data.phone} onChange={(e) => set({ ...data, phone: e.target.value })} className="bg-white/5 border-white/10 text-white" dir="ltr" />
        </div>
        <div className="space-y-2">
          <Label className="text-white/70 text-sm">المدينة</Label>
          <select value={data.city} onChange={(e) => set({ ...data, city: e.target.value })} className="w-full h-10 rounded-md border border-white/10 bg-white/5 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sovereign-gold/50">
            {algerianCities.map((city) => (
              <option key={city} value={city} className="bg-sovereign-obsidian text-white">{city}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-white/70 text-sm">نبذة عنك</Label>
        <Textarea value={data.bio} onChange={(e) => set({ ...data, bio: e.target.value })} placeholder="أخبرنا عن نفسك..." className="bg-white/5 border-white/10 text-white min-h-[80px]" />
      </div>
      <div className="flex justify-start pt-2">
        <SovereignButton variant="primary" onClick={onSave} isLoading={isPending}>
          {isPending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
        </SovereignButton>
      </div>
    </div>
  );
}

export function NotificationsSection({ data, set, isPending, onSave }: {
  data: Record<string, boolean>;
  set: (next: Record<string, boolean>) => void;
  isPending: boolean;
  onSave: () => void;
}) {
  return (
    <div className="space-y-4 mt-4">
      {notificationToggles.map((toggle) => (
        <div key={toggle.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
          <div>
            <p className="text-sm font-bold text-white/90">{toggle.label}</p>
            <p className="text-xs text-white/40 mt-0.5">{toggle.desc}</p>
          </div>
          <Switch checked={data[toggle.id]} onCheckedChange={(checked) => set({ ...data, [toggle.id]: checked })} />
        </div>
      ))}
      <div className="flex justify-start pt-2">
        <SovereignButton variant="primary" onClick={onSave} isLoading={isPending}>
          {isPending ? 'جارٍ الحفظ...' : 'حفظ التفضيلات'}
        </SovereignButton>
      </div>
    </div>
  );
}

export function SecuritySection({ data, set, isPending, onChangePassword, onEnable2FA }: {
  data: { currentPassword: string; newPassword: string; confirmPassword: string };
  set: (next: { currentPassword: string; newPassword: string; confirmPassword: string } | ((prev: { currentPassword: string; newPassword: string; confirmPassword: string }) => { currentPassword: string; newPassword: string; confirmPassword: string })) => void;
  isPending: boolean;
  onChangePassword: () => void;
  onEnable2FA: () => void;
}) {
  return (
    <div className="space-y-5 mt-4">
      <div className="space-y-2">
        <Label className="text-white/70 text-sm">كلمة المرور الحالية</Label>
        <Input type="password" value={data.currentPassword} onChange={(e) => set({ ...data, currentPassword: e.target.value })} placeholder="•••••••" className="bg-white/5 border-white/10 text-white" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-white/70 text-sm">كلمة المرور الجديدة</Label>
          <Input type="password" value={data.newPassword} onChange={(e) => set({ ...data, newPassword: e.target.value })} placeholder="•••••••" className="bg-white/5 border-white/10 text-white" />
        </div>
        <div className="space-y-2">
          <Label className="text-white/70 text-sm">تأكيد كلمة المرور الجديدة</Label>
          <Input type="password" value={data.confirmPassword} onChange={(e) => set({ ...data, confirmPassword: e.target.value })} placeholder="•••••••" className="bg-white/5 border-white/10 text-white" />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <SovereignButton variant="primary" onClick={onChangePassword} isLoading={isPending}>
          {isPending ? 'جارٍ التغيير...' : 'تغيير كلمة المرور'}
        </SovereignButton>
        <SovereignButton variant="secondary" onClick={onEnable2FA}>تفعيل المصادقة الثنائية</SovereignButton>
      </div>
    </div>
  );
}

function RadioOption({ value, label, current, onChange }: { value: string; label: string; current: string; onChange: (v: string) => void }) {
  const isActive = current === value;
  return (
    <label className={`flex items-center gap-3 px-5 py-3 rounded-2xl border cursor-pointer transition-all ${
      isActive ? 'border-sovereign-gold/50 bg-sovereign-gold/10' : 'border-white/10 bg-white/5 hover:border-white/20'
    }`}>
      <input type="radio" name={label} value={value} checked={isActive} onChange={(e) => onChange(e.target.value)} className="sr-only" />
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-sovereign-gold' : 'border-white/30'}`}>
        {isActive && <div className="w-2 h-2 rounded-full bg-sovereign-gold" />}
      </div>
      <span className="text-sm font-bold text-white/90">{label}</span>
    </label>
  );
}

export function AppearanceSection({ data, set, isPending, onSave }: {
  data: { theme: string; language: string };
  set: (next: { theme: string; language: string } | ((prev: { theme: string; language: string }) => { theme: string; language: string })) => void;
  isPending: boolean;
  onSave: () => void;
}) {
  return (
    <div className="space-y-6 mt-4">
      <div className="space-y-3">
        <Label className="text-white/70 text-sm font-bold">المظهر</Label>
        <div className="flex gap-4">
          <RadioOption value="light" label="فاتح" current={data.theme} onChange={(v) => set({ ...data, theme: v })} />
          <RadioOption value="dark" label="داكن" current={data.theme} onChange={(v) => set({ ...data, theme: v })} />
        </div>
      </div>
      <div className="space-y-3">
        <Label className="text-white/70 text-sm font-bold">اللغة</Label>
        <div className="flex gap-4">
          <RadioOption value="ar" label="العربية" current={data.language} onChange={(v) => set({ ...data, language: v })} />
          <RadioOption value="fr" label="الفرنسية" current={data.language} onChange={(v) => set({ ...data, language: v })} />
        </div>
      </div>
      <div className="flex justify-start pt-2">
        <SovereignButton variant="primary" onClick={onSave} isLoading={isPending}>
          {isPending ? 'جارٍ الحفظ...' : 'حفظ التفضيلات'}
        </SovereignButton>
      </div>
    </div>
  );
}
