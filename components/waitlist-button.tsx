'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { bookingsApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';

interface WaitlistButtonProps {
  productId: string;
}

export function WaitlistButton({ productId }: WaitlistButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [added, setAdded] = useState(false);

  const addToWaitlistMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => bookingsApi.addToWaitlist(data),
    onSuccess: (res: { dignity_preserved?: boolean; error?: string; message_ar?: string }) => {
      if (res?.success === false || res?.error) {
        toast.error(res?.message_ar || res?.error || 'حدث خطأ');
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

