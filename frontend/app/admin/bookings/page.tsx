'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { BookingTable } from '@/components/admin/booking-table';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function AdminBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'admin' && user?.role !== 'staff') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['admin-bookings', statusFilter],
    queryFn: () => adminApi.getAllBookings({ status: statusFilter || undefined }).then((res) => res.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff'),
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-booking-stats'],
    queryFn: () => adminApi.getBookingStats().then((res) => res.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff'),
  });

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
    return null;
  }

  const filteredBookings = bookings?.filter((booking: { user_email?: string; product?: { name_ar?: string; name?: string } }) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        booking.user_email?.toLowerCase().includes(searchLower) ||
        booking.product?.name_ar?.toLowerCase().includes(searchLower) ||
        booking.product?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">إدارة الحجوزات</h1>
        <p className="text-muted-foreground">عرض وإدارة جميع الحجوزات</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الحجوزات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totals?.bookings || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totals?.pending || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">مؤكد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totals?.confirmed || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">قيد الاستخدام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totals?.in_use || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في الحجوزات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">جميع الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="confirmed">مؤكد</option>
              <option value="in_use">قيد الاستخدام</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل الحجوزات...</p>
        </div>
      ) : (
        <BookingTable
          bookings={filteredBookings}
          onRefresh={() => refetch()}
        />
      )}
    </div>
  );
}

