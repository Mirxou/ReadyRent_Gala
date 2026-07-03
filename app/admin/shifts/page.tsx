'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Shift {
  id: number;
  staff: number;
  staff_email: string;
  staff_name?: string;
  branch: number;
  branch_name: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  is_completed: boolean;
  notes: string;
}

interface Branch {
  id: number;
  name_ar: string;
}

interface User {
  id: number;
  email: string;
  profile?: {
    first_name_ar: string;
    last_name_ar: string;
  };
}

export default function AdminShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [formData, setFormData] = useState({
    staff: '',
    branch: '',
    shift_date: '',
    start_time: '',
    end_time: '',
    notes: '',
  });

  useEffect(() => {
    fetchShifts();
    fetchBranches();
    fetchStaff();
  }, []);

  const fetchShifts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/users/staff/shifts/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShifts(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/users/staff/list/');
      if (response.ok) {
        const data = await response.json();
        setStaff(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleCreateShift = () => {
    setSelectedShift(null);
    setFormData({
      staff: '',
      branch: '',
      shift_date: '',
      start_time: '',
      end_time: '',
      notes: '',
    });
    setOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setFormData({
      staff: shift.staff.toString(),
      branch: shift.branch.toString(),
      shift_date: shift.shift_date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      notes: shift.notes || '',
    });
    setOpen(true);
  };

  const handleSaveShift = async () => {
    if (!formData.staff || !formData.branch || !formData.shift_date || !formData.start_time || !formData.end_time) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const url = selectedShift
        ? `/api/users/staff/shifts/${selectedShift.id}/`
        : '/api/users/staff/shifts/';
      const method = selectedShift ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          staff: parseInt(formData.staff),
          branch: parseInt(formData.branch),
        }),
      });

      if (response.ok) {
        setOpen(false);
        fetchShifts();
      } else {
        const error = await response.json();
        alert(error.detail || 'حدث خطأ أثناء حفظ المناوبة');
      }
    } catch (error) {
      console.error('Error saving shift:', error);
      alert('حدث خطأ أثناء حفظ المناوبة');
    }
  };

  const handleToggleComplete = async (shift: Shift) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/users/staff/shifts/${shift.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_completed: !shift.is_completed }),
      });

      if (response.ok) {
        fetchShifts();
      }
    } catch (error) {
      console.error('Error updating shift:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">إدارة المناوبات</h1>
          <p className="text-gray-600">جدولة وإدارة مناوبات الموظفين</p>
        </div>
        <Button onClick={handleCreateShift}>إضافة مناوبة جديدة</Button>
      </div>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>الفرع</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>وقت البداية</TableHead>
                <TableHead>وقت النهاية</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    لا توجد مناوبات
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>{shift.staff_name || shift.staff_email}</TableCell>
                    <TableCell>{shift.branch_name}</TableCell>
                    <TableCell>{new Date(shift.shift_date).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>{shift.start_time}</TableCell>
                    <TableCell>{shift.end_time}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          shift.is_completed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {shift.is_completed ? 'مكتملة' : 'قيد التنفيذ'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditShift(shift)}
                        >
                          تعديل
                        </Button>
                        <Button
                          variant={shift.is_completed ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => handleToggleComplete(shift)}
                        >
                          {shift.is_completed ? 'إلغاء الإكمال' : 'تم الإكمال'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedShift ? 'تعديل المناوبة' : 'إضافة مناوبة جديدة'}</DialogTitle>
            <DialogDescription>حدد الموظف والفرع وتفاصيل المناوبة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="staff">الموظف</Label>
              <Select value={formData.staff} onValueChange={(value) => setFormData({ ...formData, staff: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.profile ? `${s.profile.first_name_ar} ${s.profile.last_name_ar}` : s.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="branch">الفرع</Label>
              <Select value={formData.branch} onValueChange={(value) => setFormData({ ...formData, branch: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="shift_date">التاريخ</Label>
              <Input
                id="shift_date"
                type="date"
                value={formData.shift_date}
                onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">وقت البداية</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_time">وقت النهاية</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">ملاحظات</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveShift}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


