'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getAuthHeaders } from '@/lib/auth-helpers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface RoleSelectorProps {
  userId: number;
  onRoleAssigned?: () => void;
}

interface Branch {
  id: number;
  name_ar: string;
}

interface StaffRole {
  id: number;
  role: string;
  branch: number | null;
  branch_name?: string;
  department: string;
  is_active: boolean;
}

const ROLE_CHOICES = [
  { value: 'admin', label: 'مدير' },
  { value: 'manager', label: 'مدير فرع' },
  { value: 'staff', label: 'موظف' },
  { value: 'delivery', label: 'موظف توصيل' },
  { value: 'support', label: 'موظف دعم' },
];

export default function RoleSelector({ userId, onRoleAssigned }: RoleSelectorProps) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string>('');
  const [branchId, setBranchId] = useState<string>('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await fetch('/api/branches/');
      if (response.ok) {
        const data = await response.json();
        return (data.results || data) as Branch[];
      }
      return [];
    },
  });
  const branches = branchesData ?? [];

  const { data: existingRolesData } = useQuery({
    queryKey: ['staff-roles', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/staff/roles/?user=${userId}`);
      if (response.ok) {
        const data = await response.json();
        return (data.results || data) as StaffRole[];
      }
      return [];
    },
  });
  const existingRoles = existingRolesData ?? [];

  const handleAssignRole = async () => {
    if (!role) {
      alert('يرجى اختيار الدور');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users/staff/roles/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          user: userId,
          role,
          branch: branchId ? parseInt(branchId) : null,
          department,
          is_active: true,
        }),
      });

      if (response.ok) {
        setOpen(false);
        setRole('');
        setBranchId('');
        setDepartment('');
        queryClient.invalidateQueries({ queryKey: ['staff-roles', userId] });
        onRoleAssigned?.();
      } else {
        const error = await response.json();
        alert(error.detail || 'حدث خطأ أثناء تعيين الدور');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('حدث خطأ أثناء تعيين الدور');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateRole = async (roleId: number) => {
    if (!confirm('هل أنت متأكد من إلغاء تفعيل هذا الدور؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/staff/roles/${roleId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ is_active: false }),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['staff-roles', userId] });
        onRoleAssigned?.();
      }
    } catch (error) {
      console.error('Error deactivating role:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">الأدوار المعينة</h3>
        <Button onClick={() => setOpen(true)}>تعيين دور جديد</Button>
      </div>

      {existingRoles.length > 0 ? (
        <div className="space-y-2">
          {existingRoles.map((staffRole) => (
            <div
              key={staffRole.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-medium">
                  {ROLE_CHOICES.find((r) => r.value === staffRole.role)?.label || staffRole.role}
                </p>
                {staffRole.branch_name && (
                  <p className="text-sm text-gray-500">الفرع: {staffRole.branch_name}</p>
                )}
                {staffRole.department && (
                  <p className="text-sm text-gray-500">القسم: {staffRole.department}</p>
                )}
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    staffRole.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {staffRole.is_active ? 'نشط' : 'غير نشط'}
                </span>
              </div>
              {staffRole.is_active && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeactivateRole(staffRole.id)}
                >
                  إلغاء التفعيل
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">لا توجد أدوار معينة</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعيين دور جديد</DialogTitle>
            <DialogDescription>اختر الدور والفرع والقسم للموظف</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">الدور</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_CHOICES.map((choice) => (
                    <SelectItem key={choice.value} value={choice.value}>
                      {choice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="branch">الفرع (اختياري)</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الفروع</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">القسم</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="مثال: المبيعات، التوصيل، الدعم"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAssignRole} disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
