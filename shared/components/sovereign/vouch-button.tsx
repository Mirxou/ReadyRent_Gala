'use client';

import { useState } from 'react';
import { Heart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface VouchButtonProps {
  userId: string;
  vouched?: boolean;
  vouchCount?: number;
  onVouch?: () => void;
}

export function VouchButton({ userId, vouched, vouchCount = 0, onVouch }: VouchButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleVouch = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/social/vouch/${userId}`, { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (res.ok) { toast.success('تم تسجيل الضمان بنجاح'); onVouch?.(); }
      else toast.error(json?.message || 'فشل تسجيل الضمان');
    } catch { toast.error('حدث خطأ'); }
    finally { setLoading(false); }
  };

  return (
    <Button variant={vouched ? 'secondary' : 'outline'} size="sm" onClick={handleVouch} disabled={loading || vouched} className="gap-1.5">
      {vouched ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Heart className="h-3.5 w-3.5" />}
      <span>{vouched ? 'تم الضمان' : 'ضمان'}</span>
      {vouchCount > 0 && <span className="text-xs text-muted-foreground">({vouchCount})</span>}
    </Button>
  );
}
