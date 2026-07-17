'use client';

import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface Booking {
  id: string;
  user: any;
  product: any;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  created_at: string;
}

interface BookingActionsProps {
  booking: Booking;
  onStatusUpdate?: (id: string, status: string) => void;
  onRefresh?: () => void;
}

export function BookingActions({ booking, onStatusUpdate, onRefresh }: BookingActionsProps) {
  const handleUpdateStatus = async (status: string) => {
    if (onStatusUpdate) {
      onStatusUpdate(booking.id, status);
    }
    onRefresh?.();
  };

  return (
    <div className="flex items-center gap-1">
      {booking.status === 'pending' && (
        <>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => handleUpdateStatus('confirmed')}
            title="تأكيد"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleUpdateStatus('cancelled')}
            title="رفض"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}
      {booking.status === 'confirmed' && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={() => handleUpdateStatus('in_use')}
          title="بدء الاستخدام"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}