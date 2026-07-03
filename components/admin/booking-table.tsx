'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Edit, MoreHorizontal } from 'lucide-react';
import { BookingActions } from './booking-actions';

interface Booking {
  id: number;
  user: any;
  product: any;
  start_date: string;
  end_date: string;
  total_days: number;
  total_price: number;
  status: string;
  created_at: string;
}

interface BookingTableProps {
  bookings: Booking[];
  onStatusUpdate?: (id: number, status: string) => void;
  onRefresh?: () => void;
}

export function BookingTable({ bookings, onStatusUpdate, onRefresh }: BookingTableProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'قيد الانتظار', variant: 'outline' },
      confirmed: { label: 'مؤكد', variant: 'default' },
      in_use: { label: 'قيد الاستخدام', variant: 'default' },
      completed: { label: 'مكتمل', variant: 'secondary' },
      cancelled: { label: 'ملغي', variant: 'destructive' },
    };
    
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        لا توجد حجوزات
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>المستخدم</TableHead>
            <TableHead>المنتج</TableHead>
            <TableHead>من</TableHead>
            <TableHead>إلى</TableHead>
            <TableHead>المدة</TableHead>
            <TableHead>السعر</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead className="text-left">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">
                {booking.user?.email || booking.user?.username || 'غير معروف'}
              </TableCell>
              <TableCell>{booking.product?.name_ar || booking.product?.name || '-'}</TableCell>
              <TableCell>{formatDate(booking.start_date)}</TableCell>
              <TableCell>{formatDate(booking.end_date)}</TableCell>
              <TableCell>{booking.total_days} يوم</TableCell>
              <TableCell>{Number(booking.total_price).toFixed(0)} دج</TableCell>
              <TableCell>{getStatusBadge(booking.status)}</TableCell>
              <TableCell>{formatDate(booking.created_at)}</TableCell>
              <TableCell>
                <BookingActions
                  booking={booking}
                  onStatusUpdate={onStatusUpdate}
                  onRefresh={onRefresh}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

