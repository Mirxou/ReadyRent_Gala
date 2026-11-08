'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAuthHeaders } from '@/lib/auth-helpers';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  is_verified: boolean;
  profile?: {
    first_name_ar: string;
    last_name_ar: string;
  } | null;
  created_at?: string;
}

// Real roles in this schema (PATCH /api/admin/users/[id] whitelist)
const ASSIGNABLE_ROLES: Record<string, string> = {
  customer: 'عميل',
  vendor: 'بائع (vendor)',
  admin: 'مدير النظام',
  staff: 'موظف',
};

const ROLE_CHOICES: Record<string, string> = {
  admin: 'مدير النظام',
  staff: 'موظف',
  vendor: 'بائع (vendor)',
  manager: 'مدير فرع',
  delivery: 'موظف توصيل',
  support: 'موظف دعم',
};

export default function AdminStaffPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [savingRole, setSavingRole] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/admin/staff';
      if (roleFilter !== 'all') {
        url += `?role=${roleFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    requestAnimationFrame(() => { fetchStaff(); });
  }, [fetchStaff]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.profile?.first_name_ar || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.profile?.last_name_ar || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleManageRoles = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setShowRoleDialog(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser || !selectedRole) return;
    setSavingRole(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.success === false) {
        toast.error(data?.message_ar || data?.message_en || 'فشل تحديث الدور');
        return;
      }
      toast.success('تم تحديث الدور بنجاح');
      setShowRoleDialog(false);
      fetchStaff();
    } catch {
      toast.error('خطأ في الاتصال — أعد المحاولة');
    } finally {
      setSavingRole(false);
    }
  };

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-lg text-muted-foreground">غير مصرح بالوصول</p></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">إدارة الموظفين</h1>
        <p className="text-gray-600">إدارة الموظفين والأدوار والصلاحيات</p>
      </div>

      <div className="mb-6 flex gap-4">
        <Input
          placeholder="البحث بالاسم أو البريد الإلكتروني..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="فلترة حسب الدور" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأدوار</SelectItem>
            <SelectItem value="admin">مدير النظام</SelectItem>
            <SelectItem value="staff">موظف</SelectItem>
            <SelectItem value="vendor">بائع (vendor)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الدور الأساسي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    لا يوجد موظفون
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.profile
                        ? `${user.profile.first_name_ar} ${user.profile.last_name_ar}`
                        : user.username}
                    </TableCell>
                    <TableCell>{ROLE_CHOICES[user.role] || user.role}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.is_verified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.is_verified ? 'موثق' : 'غير موثق'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageRoles(user)}
                      >
                        إدارة الأدوار
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إدارة أدوار الموظف</DialogTitle>
            <DialogDescription>
              {selectedUser?.email} - {selectedUser?.profile ? `${selectedUser.profile.first_name_ar} ${selectedUser.profile.last_name_ar}` : selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">الدور الحالي: {ROLE_CHOICES[selectedUser.role] || selectedUser.role}</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الدور الجديد" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ASSIGNABLE_ROLES).map(([value, label]) => (
                      <SelectItem key={value} value={value} disabled={value === selectedUser.role}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  ملاحظة: لا يمكنك تغيير دورك الشخصي — تغييرات الأدوار تؤثر فوراً على صلاحيات الحساب
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRoleDialog(false)} disabled={savingRole}>
                  إلغاء
                </Button>
                <Button onClick={handleSaveRole} disabled={savingRole || selectedRole === selectedUser.role}>
                  {savingRole ? 'جارٍ الحفظ...' : 'حفظ الدور'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


