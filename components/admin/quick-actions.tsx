'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Package,
  Calendar,
  BarChart3,
  Users,
  Plus,
  FileText,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';

export function QuickActions() {
  const actions = [
    {
      title: 'إضافة منتج جديد',
      description: 'إضافة منتج جديد إلى الكتالوج',
      icon: Plus,
      href: '/admin/products/create',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'الحجوزات المعلقة',
      description: 'عرض وإدارة الحجوزات المعلقة',
      icon: Calendar,
      href: '/admin/bookings?status=pending',
      color: 'from-orange-500 to-yellow-500',
    },
    {
      title: 'التقارير والتحليلات',
      description: 'عرض التقارير التفصيلية والتحليلات',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'إدارة المستخدمين',
      description: 'عرض وإدارة حسابات المستخدمين',
      icon: Users,
      href: '/admin/users',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'إدارة المنتجات',
      description: 'عرض وتحرير جميع المنتجات',
      icon: Package,
      href: '/admin/products',
      color: 'from-pink-500 to-rose-500',
    },
    {
      title: 'الإعدادات',
      description: 'إعدادات النظام العامة',
      icon: Settings,
      href: '/admin/settings',
      color: 'from-gray-500 to-slate-500',
    },
  ];

  return (
    <Card className="card-glass border-0 rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-2xl font-bold flex items-center gap-3">
          <FileText className="h-6 w-6 text-gala-gold" />
          إجراءات سريعة
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={action.href}>
                  <Button
                    variant="outline"
                    className="w-full h-auto p-6 flex flex-col items-start gap-4 rounded-3xl border-white/10 hover:bg-white/5 transition-all group relative overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                    <div className="flex items-center gap-4 w-full relative z-10">
                      <div className={`bg-gradient-to-br ${action.color} p-3 rounded-2xl shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-bold text-lg group-hover:text-white transition-colors">{action.title}</div>
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

