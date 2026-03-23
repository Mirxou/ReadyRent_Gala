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
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

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
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gala-purple to-gala-pink bg-clip-text text-transparent">
                    إدارة الطلبات
                </h1>
                <p className="text-muted-foreground">تتبع ومراجعة طلبات الحجز الواردة.</p>
            </div>

            {/* Tabs / Filter */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
                {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                ? 'bg-white dark:bg-white/10 text-gala-purple shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {tab === 'all' ? 'الكل' :
                            tab === 'pending' ? 'قيد الانتظار' :
                                tab === 'confirmed' ? 'مؤكدة' :
                                    tab === 'completed' ? 'مكتملة' : 'ملغاة'}
                    </button>
                ))}
            </div>

            <div className="grid gap-4">
                {orders.map((order) => (
                    <div key={order.id} className="card-glass p-6 group transition-all duration-300 hover:border-gala-purple/30">
                        <div className="flex flex-col md:flex-row gap-6">

                            {/* Product Image */}
                            <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden relative shrink-0">
                                <img src={order.product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute top-2 right-2 bg-black/60 rounded-md px-2 py-1 text-xs text-white font-mono backdrop-blur-sm">
                                    {order.id}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            {order.product.name}
                                            <Badge variant="outline" className={`
                             ${order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                    order.status === 'confirmed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                        'bg-blue-500/10 text-blue-500 border-blue-500/20'}
                           `}>
                                                {order.status === 'pending' ? 'قيد المراجعة' :
                                                    order.status === 'confirmed' ? 'مؤكد' : 'مكتمل'}
                                            </Badge>
                                        </h3>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {order.dates.start} - {order.dates.end}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {order.date}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xl font-bold text-gala-purple">
                                        {order.total.toLocaleString()} دج
                                    </div>
                                </div>

                                <Separator className="my-4 bg-gray-200 dark:bg-white/10" />

                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8 ring-2 ring-white dark:ring-white/10">
                                            <AvatarImage src={order.customer.image} />
                                            <AvatarFallback>{order.customer.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{order.customer.name}</p>
                                            <p className="text-xs text-muted-foreground flex items-center">
                                                <User className="w-3 h-3 mr-1" />
                                                تقييم العميل: {order.customer.rating}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="gap-2">
                                            <MessageSquare className="w-4 h-4" />
                                            مراسلة
                                        </Button>
                                        {order.status === 'pending' && (
                                            <>
                                                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 gap-2">
                                                    <XCircle className="w-4 h-4" />
                                                    رفض
                                                </Button>
                                                <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white gap-2 shadow-lg hover:shadow-green-500/25">
                                                    <CheckCircle className="w-4 h-4" />
                                                    قبول الحجز
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
