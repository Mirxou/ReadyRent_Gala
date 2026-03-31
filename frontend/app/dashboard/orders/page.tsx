'use client';

import { useState } from 'react';
import {
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    User,
    MessageSquare,
    Search,
    Filter,
    ShieldCheck,
    FileSignature,
    Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Mock Data
const orders = [
    {
        id: 'ORD-001',
        customer: { name: 'أمينة ب.', image: 'https://i.pravatar.cc/150?u=a', rating: 4.9 },
        product: { name: 'فستان سهرة ملكي أسود', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80' },
        dates: { start: '2026-03-10', end: '2026-03-12' },
        total: 30000,
        status: 'pending',
        date: 'منذ ساعتين'
    },
    {
        id: 'ORD-002',
        customer: { name: 'سارة م.', image: 'https://i.pravatar.cc/150?u=s', rating: 5.0 },
        product: { name: 'قفطان جزائري تقليدي', image: 'https://images.unsplash.com/photo-1583244562584-3860558b299e?w=800&q=80' },
        dates: { start: '2026-03-15', end: '2026-03-16' },
        total: 25000,
        status: 'confirmed',
        date: 'أمس'
    },
    {
        id: 'ORD-003',
        customer: { name: 'ليلى ك.', image: 'https://i.pravatar.cc/150?u=l', rating: 4.5 },
        product: { name: 'فستان خطوبة وردي', image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80' },
        dates: { start: '2026-02-28', end: '2026-03-01' },
        total: 18000,
        status: 'completed',
        date: '2026-02-20'
    }
];

export default function OrdersPage() {
    const [activeTab, setActiveTab] = useState('all');

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

            <div className="grid gap-8">
                {orders.map((order) => (
                    <GlassPanel key={order.id} className="p-8 group hover:border-sovereign-gold/20 transition-all duration-500 overflow-hidden relative" gradientBorder>
                        
                        {/* Status Watermark */}
                        <div className="absolute -top-6 -left-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                            <FileSignature className="w-48 h-48 rotate-12" />
                        </div>

                        <div className="flex flex-col lg:flex-row gap-10 relative z-10">

                            {/* Product Visual Authority */}
                            <div className="w-full lg:w-48 h-64 lg:h-48 rounded-[2rem] overflow-hidden relative shrink-0 shadow-2xl border border-white/5">
                                <img src={order.product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-md rounded-lg px-3 py-1.5 text-[10px] text-foreground font-black border border-white/10 uppercase tracking-widest">
                                    {order.id}
                                </div>
                            </div>

                            {/* Contract Details */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black tracking-tight text-foreground flex flex-wrap items-center gap-4">
                                            {order.product.name}
                                            <Badge className={cn(
                                                "px-4 py-1 text-[10px] font-black uppercase border-0 rounded-full",
                                                order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 shadow-sm shadow-yellow-500/10' :
                                                order.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 shadow-sm shadow-emerald-500/10' :
                                                'bg-blue-500/10 text-blue-500'
                                            )}>
                                                {order.status === 'pending' ? 'Awaiting Signature' :
                                                    order.status === 'confirmed' ? 'Sovereign Contract' : 'Archived'}
                                            </Badge>
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-sovereign-gold" />
                                                <span className="font-mono text-foreground">{order.dates.start} — {order.dates.end}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-sovereign-gold" />
                                                <span>تم الإنشاء: {order.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-3xl font-black text-foreground tracking-tighter">
                                        {order.total.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">DA</span>
                                    </div>
                                </div>

                                <Separator className="my-8 bg-white/5" />

                                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                                    {/* Client Identity Shield */}
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 pr-4 pl-8 group/identity cursor-pointer hover:bg-white/10 transition-colors">
                                        <div className="relative">
                                            <Avatar className="w-12 h-12 border-2 border-background shadow-xl">
                                                <AvatarImage src={order.customer.image} />
                                                <AvatarFallback className="bg-sovereign-gold/10 text-sovereign-gold font-bold">{order.customer.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-4 border-background" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-foreground tracking-tight">{order.customer.name}</p>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500/80">
                                               <ShieldCheck className="w-3 h-3" /> Trust Rank: {order.customer.rating}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sovereign Actions */}
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <Link href={`/dashboard/orders/${order.id}`}>
                                            <SovereignButton variant="secondary" size="sm" className="flex-1 sm:flex-none gap-2 px-6">
                                                <FileSignature className="w-4 shadow-sm" />
                                                تفاصيل العقد
                                            </SovereignButton>
                                        </Link>
                                        
                                        {order.status === 'pending' ? (
                                            <SovereignButton variant="primary" size="sm" className="flex-1 sm:flex-none gap-2 px-10 shadow-lg shadow-sovereign-gold/10" withShimmer>
                                                إبرام العقد
                                            </SovereignButton>
                                        ) : (
                                            <SovereignButton variant="secondary" size="sm" className="flex-1 sm:flex-none gap-2 px-6">
                                                <Scale className="w-4 h-4 text-sovereign-gold" />
                                                إجراء تحميلي
                                            </SovereignButton>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassPanel>
                ))}
            </div>
            
            <footer className="mt-20 text-center py-10 border-t border-white/5">
                <p className="text-[10px] uppercase font-black tracking-[0.5em] text-muted-foreground opacity-30">
                    Sovereign Agreement Registry System | Confidential
                </p>
            </footer>
        </div>
    );
}
