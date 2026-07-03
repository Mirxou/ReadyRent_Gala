'use client';

import { useState, useEffect } from 'react';
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

interface ActivityLog {
  id: number;
  user: number | null;
  user_email: string;
  user_name?: string;
  action: string;
  model_name: string;
  object_id: number | null;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  create: 'إنشاء',
  update: 'تحديث',
  delete: 'حذف',
  view: 'عرض',
  approve: 'موافقة',
  reject: 'رفض',
  login: 'تسجيل دخول',
  logout: 'تسجيل خروج',
  other: 'أخرى',
};

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, modelFilter]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('access_token');
      let url = '/api/users/staff/activity-logs/';
      const params = new URLSearchParams();
      
      if (actionFilter !== 'all') {
        params.append('action', actionFilter);
      }
      if (modelFilter !== 'all') {
        params.append('model_name', modelFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.model_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const uniqueModels = Array.from(new Set(logs.map((log) => log.model_name)));

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">سجل الأنشطة</h1>
        <p className="text-gray-600">تتبع جميع الأنشطة في النظام</p>
      </div>

      <div className="mb-6 flex gap-4">
        <Input
          placeholder="البحث في السجل..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="فلترة حسب الإجراء" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الإجراءات</SelectItem>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={modelFilter} onValueChange={setModelFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="فلترة حسب النموذج" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع النماذج</SelectItem>
            {uniqueModels.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
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
                <TableHead>المستخدم</TableHead>
                <TableHead>الإجراء</TableHead>
                <TableHead>النموذج</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>عنوان IP</TableHead>
                <TableHead>التاريخ والوقت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    لا توجد سجلات
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.user_name || log.user_email || 'النظام'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </TableCell>
                    <TableCell>{log.model_name}</TableCell>
                    <TableCell className="max-w-md truncate">{log.description}</TableCell>
                    <TableCell>{log.ip_address || '-'}</TableCell>
                    <TableCell>
                      {new Date(log.created_at).toLocaleString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}


