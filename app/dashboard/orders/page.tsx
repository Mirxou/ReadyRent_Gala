'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
    Calendar,
    Clock,
    Search,
    ShieldCheck,
    FileSignature,
    Scale,
    Package,
    Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import Link from 'next/link';
import { cn, formatNumber } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

async function fetchBookings() {
  const res = await fetch('/api/bookings');
  const json = await res.json();
  return json.data || [];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'قيد المراجعة', className: 'bg-yellow-500/10 text-yellow-500 shadow-sm shadow-yellow-500/10' },
  confirmed: { label: 'سيادية', className: 'bg-emerald-500/10 text-emerald-500 shadow-sm shadow-emerald-500/10' },
  active: { label: 'نشط', className: 'bg-emerald-500/10 text-emerald-500 shadow-sm shadow-emerald-500/10' },
  completed: { label: 'تاريخية', className: 'bg-blue-500/10 text-blue-500' },
  cancelled: { label: 'ملغاة', className: 'bg-red-500/10 text-red-500' },
  rejected: { label: 'مرفوض', className: 'bg-red-500/10 text-red-500' },
};

export default function OrdersPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('all');
    const { data: bookings, isLoading } = useQuery({
      queryKey: ['bookings'],
      queryFn: fetchBookings,
    });

    const filteredBookings = (bookings || []).filter((b: any) => {
      if (activeTab === 'all') return true;
      return b.status === activeTab;
    });

    const formatRelativeTime = (dateStr: string) => {
      try {
        return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
      } catch {
        return dateStr;
      }
    };

    return (
        <div className="space-y-12 text-right pb-20" dir="rtl">
            <header className="space-y-4">
                <Badge variant="outline" className="border-sovereign-gold/30 text-sovereign-gold px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                   Registry of Agreements
                </Badge>
                <h1 className="text-5xl font-black tracking-tighter text-foreground">
                    إدارة العقود والوثائق<span className="text-sovereign-gold">.</span>
                </h1>
                <p className="text-muted-foreground font-light leading-relaxed max-w-2xl">تتبع ومراجعة الالتزامات القانونية والضمانات المالية للعملاء.</p>
            </header>

            {/* Tabs / Filter Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex gap-2 p-1.5 bg-white/5 border border-white/5 rounded-2xl">
                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === tab
                                    ? 'bg-sovereign-gold text-background shadow-lg shadow-sovereign-gold/10'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            )}
                        >
                            {tab === 'all' ? 'الكل' :
                                tab === 'pending' ? 'قيد المراجعة' :
                                    tab === 'confirmed' ? 'سيادية' :
                                        tab === 'completed' ? 'تاريخية' : 'ملغاة'}
                        </button>
                    ))}
                </div>
                
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-sovereign-gold transition-colors" />
                    <Input 
                        placeholder="البحث في الأصول أو الهويات..." 
                        className="pl-10 pr-6 h-12 bg-white/5 border-white/5 rounded-2xl w-full md:w-80 focus:ring-sovereign-gold/30"
                    />
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-sovereign-gold animate-spin" />
                <p className="text-sm text-muted-foreground">جارٍ تحميل العقود...</p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredBookings.length === 0 && (
              <div className="p-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
                <Package className="w-16 h-16 text-muted-foreground/10" />
                <p className="text-lg text-muted-foreground font-light">لا توجد طلبات</p>
                <p className="text-sm text-muted-foreground/60">لم يتم إنشاء أي حجوزات بعد. تصفح المنتجات وابدأ حجزك الأول.</p>
                <Link href="/products">
                  <SovereignButton variant="primary" size="sm" className="mt-4">
                    تصفح المنتجات
                  </SovereignButton>
                </Link>
              </div>
            )}

            {/* Bookings List */}
            {!isLoading && filteredBookings.length > 0 && (
            <div className="grid gap-8">
                {filteredBookings.map((order: any) => {
                  const cfg = statusConfig[order.status] || statusConfig.pending;
                  return (
                    <GlassPanel key={order.id} className="p-8 group hover:border-sovereign-gold/20 transition-all duration-500 overflow-hidden relative" gradientBorder>
                        
                        {/* Status Watermark */}
                        <div className="absolute -top-6 -left-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                            <FileSignature className="w-48 h-48 rotate-12" />
                        </div>

                        <div className="flex flex-col lg:flex-row gap-10 relative z-10">

                            {/* Contract Details */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black tracking-tight text-foreground flex flex-wrap items-center gap-4">
                                            {order.product_name || 'منتج'}
                                            <Badge className={cn(
                                                "px-4 py-1 text-[10px] font-black uppercase border-0 rounded-full",
                                                cfg.className
                                            )}>
                                                {cfg.label}
                                            </Badge>
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-sovereign-gold" />
                                                <span className="font-mono text-foreground">
                                                  {order.start_date ? formatRelativeTime(order.start_date) : '—'} — {order.end_date ? formatRelativeTime(order.end_date) : '—'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-sovereign-gold" />
                                                <span>تم الإنشاء: {formatRelativeTime(order.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-3xl font-black text-foreground tracking-tighter">
                                        {formatNumber(order.total_price || 0)} <span className="text-xs font-normal text-muted-foreground">DA</span>
                                    </div>
                                </div>

                                <Separator className="my-8 bg-white/5" />

                                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                                    {/* Booking ID Badge */}
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 pr-4 pl-8">
                                        <div className="relative">
                                            <Avatar className="w-12 h-12 border-2 border-background shadow-xl">
                                                <AvatarFallback className="bg-sovereign-gold/10 text-sovereign-gold font-bold text-sm">
                                                  {String(order.id).slice(-2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-4 border-background" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-foreground tracking-tight font-mono">#{order.id}</p>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500/80">
                                               <ShieldCheck className="w-3 h-3" /> محمي بالضمان
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sovereign Actions */}
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <SovereignButton variant="secondary" size="sm" className="flex-1 sm:flex-none gap-2 px-6" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
                                            <FileSignature className="w-4 shadow-sm" />
                                            تفاصيل العقد
                                        </SovereignButton>
                                        
                                        {order.status === 'pending' ? (
                                            <SovereignButton variant="primary" size="sm" className="flex-1 sm:flex-none gap-2 px-10 shadow-lg shadow-sovereign-gold/10" withShimmer onClick={() => toast.info('جارٍ إبرام العقد...')}>
                                                إبرام العقد
                                            </SovereignButton>
                                        ) : (
                                            <SovereignButton variant="secondary" size="sm" className="flex-1 sm:flex-none gap-2 px-6" onClick={() => toast.info('جارٍ التنفيذ...')}>
                                                <Scale className="w-4 h-4 text-sovereign-gold" />
                                                إجراء تحميلي
                                            </SovereignButton>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassPanel>
                  );
                })}
            </div>
            )}
            
            <footer className="mt-20 text-center py-10 border-t border-white/5">
                <p className="text-[10px] uppercase font-black tracking-[0.5em] text-muted-foreground opacity-30">
                    Sovereign Agreement Registry System | Confidential
                </p>
            </footer>
        </div>
    );
}