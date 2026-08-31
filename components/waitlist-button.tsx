'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { bookingsApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import type { SovereignResponse } from '@/types/sovereign';

interface WaitlistButtonProps {
  productId: string;
}

export function WaitlistButton({ productId }: WaitlistButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [added, setAdded] = useState(false);

  // WL-BUG-2 FIX: detect sovereignClient failure correctly
  const addToWaitlistMutation = useMutation({
    mutationFn: (data: { productId: string }) => bookingsApi.addToWaitlist(data),
    onSuccess: (res: SovereignResponse<unknown>) => {
      // sovereignClient returns {status:'sovereign_halt', data:null} on network failure
      if (res.status === 'sovereign_halt' || res.data == null) {
        toast.error(res.message_ar || 'حدث خطأ في الاتصال');
        return;
      }
      // Check API-level error (e.g. 409 ALREADY_EXISTS)
      const apiData = res.data as Record<string, unknown> | null;
      if (apiData && 'success' in apiData && apiData.success === false) {
        toast.error((apiData.message_ar as string) || (apiData.message_en as string) || 'حدث خطأ');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast.success('تم إضافة المنتج إلى لائحة الانتظار');
      setAdded(true);
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  if (added) {
    return (
      <Button variant="outline" disabled>
        <Bell className="h-4 w-4 mr-2" />
        في لائحة الانتظار
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => {
        addToWaitlistMutation.mutate({ productId });
      }}
      disabled={addToWaitlistMutation.isPending}
    >
      <Bell className="h-4 w-4 mr-2" />
      {addToWaitlistMutation.isPending ? 'جاري الإضافة...' : 'أضف إلى لائحة الانتظار'}
    </Button>
  );
}
