'use client';

import { useState, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [existingRoles, setExistingRoles] = useState<StaffRole[]>([]);

  useEffect(() => {
    fetchBranches();
    fetchExistingRoles();
  }, [userId]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches/');
      if (response.ok) {
        const data = await response.json();
        setBranches(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchExistingRoles = async () => {
    try {
      const response = await fetch(`/api/users/staff/roles/?user=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setExistingRoles(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching existing roles:', error);
    }
  };

  const handleAssignRole = async () => {
    if (!role) {
      alert('يرجى اختيار الدور');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/users/staff/roles/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
        fetchExistingRoles();
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
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/users/staff/roles/${roleId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: false }),
      });

      if (response.ok) {
        fetchExistingRoles();
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


