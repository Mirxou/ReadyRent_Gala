'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Ban, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'admin' && user?.role !== 'staff') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter],
    queryFn: () => adminApi.getAllUsers({ role: roleFilter || undefined }).then((res) => res.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff'),
  });

  // Track per-user updating states for optimistic feedback
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: string; is_active?: boolean } }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('تم التحديث بنجاح');
      setUpdatingUserId(null);
    },
    onError: (err: { data?: { message_en?: string } }) => {
      toast.error(err?.data?.message_en || 'حدث خطأ أثناء التحديث');
      setUpdatingUserId(null);
    },
  });

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
    return null;
  }

  const filteredUsers = users?.filter((u: any) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        u.email?.toLowerCase().includes(searchLower) ||
        u.username?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || users || [];

  const handleRoleChange = (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    updateUserMutation.mutate({ id: userId, data: { role: newRole } });
  };

  const handleToggleBan = (userId: string, currentActive: boolean) => {
    setUpdatingUserId(userId);
    updateUserMutation.mutate({ id: userId, data: { is_active: !currentActive } });
  };

  const isUpdating = (userId: string) => updatingUserId === userId && updateUserMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">إدارة المستخدمين</h1>
        <p className="text-muted-foreground">عرض وإدارة جميع المستخدمين</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في المستخدمين..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">جميع الأدوار</option>
              <option value="admin">مدير</option>
              <option value="staff">موظف</option>
              <option value="customer">عميل</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل المستخدمين...</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المعرف</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>اسم المستخدم</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-xs font-mono">{u.id.slice(0, 8)}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(value) => handleRoleChange(u.id, value)}
                      disabled={isUpdating(u.id) || u.id === user?.id}
                    >
                      <SelectTrigger size="sm" className="w-24">
                        {isUpdating(u.id) ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">عميل</SelectItem>
                        <SelectItem value="vendor">بائع</SelectItem>
                        <SelectItem value="admin">مدير</SelectItem>
                        <SelectItem value="staff">موظف</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={u.is_active !== false ? 'default' : 'destructive'}>
                        {u.is_active !== false ? 'نشط' : 'محظور'}
                      </Badge>
                      {u.is_verified && (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                          مؤكد
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(u.created_at).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={u.is_active !== false ? 'outline' : 'default'}
                      size="sm"
                      disabled={isUpdating(u.id) || u.id === user?.id}
                      onClick={() => handleToggleBan(u.id, u.is_active !== false)}
                      className="gap-1.5"
                    >
                      {isUpdating(u.id) ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : u.is_active !== false ? (
                        <Ban className="size-3.5" />
                      ) : (
                        <CheckCircle2 className="size-3.5" />
                      )}
                      {u.is_active !== false ? 'حظر' : 'تفعيل'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

