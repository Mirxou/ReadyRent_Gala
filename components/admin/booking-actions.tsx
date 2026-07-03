'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, X, Edit } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BookingActionsProps {
  booking: any;
  onStatusUpdate?: (id: number, status: string) => void;
  onRefresh?: () => void;
}

export function BookingActions({ booking, onStatusUpdate, onRefresh }: BookingActionsProps) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(booking.status);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      adminApi.updateBooking(booking.id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast.success('تم تحديث حالة الحجز بنجاح');
      setIsStatusDialogOpen(false);
      onStatusUpdate?.(booking.id, selectedStatus);
      onRefresh?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'حدث خطأ أثناء التحديث');
    },
  });

  const handleStatusUpdate = () => {
    if (selectedStatus !== booking.status) {
      updateStatusMutation.mutate(selectedStatus);
    } else {
      setIsStatusDialogOpen(false);
    }
  };

  const quickConfirm = () => {
    updateStatusMutation.mutate('confirmed');
  };

  const quickCancel = () => {
    updateStatusMutation.mutate('cancelled');
  };

  return (
    <div className="flex items-center gap-2">
      {booking.status === 'pending' && (
        <>
          <Button
            size="sm"
            variant="default"
            onClick={quickConfirm}
            disabled={updateStatusMutation.isPending}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={quickCancel}
            disabled={updateStatusMutation.isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsStatusDialogOpen(true)}
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث حالة الحجز</DialogTitle>
            <DialogDescription>
              اختر الحالة الجديدة للحجز #{booking.id}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="confirmed">مؤكد</SelectItem>
                <SelectItem value="in_use">قيد الاستخدام</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updateStatusMutation.isPending || selectedStatus === booking.status}
            >
              {updateStatusMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

