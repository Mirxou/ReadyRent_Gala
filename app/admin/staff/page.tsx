'use client';

import { useState, useEffect } from 'react';
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
import RoleSelector from '@/components/role-selector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  is_verified: boolean;
  profile?: {
    first_name_ar: string;
    last_name_ar: string;
  };
}

const ROLE_CHOICES: Record<string, string> = {
  customer: 'عميل',
  admin: 'مدير',
  manager: 'مدير فرع',
  staff: 'موظف',
  delivery: 'موظف توصيل',
  support: 'موظف دعم',
};

export default function AdminStaffPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, [roleFilter]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      let url = '/api/users/staff/list/';
      if (roleFilter !== 'all') {
        url += `?role=${roleFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
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
  };

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
    setShowRoleDialog(true);
  };

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
            <SelectItem value="admin">مدير</SelectItem>
            <SelectItem value="manager">مدير فرع</SelectItem>
            <SelectItem value="staff">موظف</SelectItem>
            <SelectItem value="delivery">موظف توصيل</SelectItem>
            <SelectItem value="support">موظف دعم</SelectItem>
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
            <RoleSelector
              userId={selectedUser.id}
              onRoleAssigned={() => {
                fetchStaff();
                setShowRoleDialog(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


