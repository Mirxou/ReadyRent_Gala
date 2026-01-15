'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { bookingsApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';

interface WaitlistButtonProps {
  productId: number;
}

export function WaitlistButton({ productId }: WaitlistButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [added, setAdded] = useState(false);

  const addToWaitlistMutation = useMutation({
    mutationFn: (data: any) => bookingsApi.addToWaitlist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast.success('تم إضافة المنتج إلى لائحة الانتظار');
      setAdded(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'حدث خطأ');
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
        addToWaitlistMutation.mutate({ product_id: productId });
      }}
      disabled={addToWaitlistMutation.isPending}
    >
      <Bell className="h-4 w-4 mr-2" />
      {addToWaitlistMutation.isPending ? 'جاري الإضافة...' : 'أضف إلى لائحة الانتظار'}
    </Button>
  );
}

