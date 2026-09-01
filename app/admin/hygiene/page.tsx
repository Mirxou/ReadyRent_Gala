'use client';

import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminHygienePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'admin' && user?.role !== 'staff') { router.push('/dashboard'); }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) return null;

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold">إدارة التعقيم</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          هذه الصفحة غير متاحة حالياً — نظام التعقيم الصناعي لا يناسب منصة كراء فساتين فاخرة.
        </p>
      </div>
    </div>
  );
}
