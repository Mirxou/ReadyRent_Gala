'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { 
  ShieldCheck, 
  Calendar, 
  ChevronLeft,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignSeal } from '@/shared/components/sovereign/sovereign-seal';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { AgreementRecorder } from '@/components/AgreementRecorder';
import { EscrowTracker } from '@/features/finance/components/escrow-tracker';
import type { EscrowState } from '@/features/finance/components/escrow-tracker';

interface BookingDetail {
    id: number;
    start_date: string;
    end_date: string;
    total_price: number;
    status: string;
    escrow_status: 'HELD' | 'RELEASED' | 'REFUNDED' | 'INITIATED';
    vault_address?: string;
    product: {
        id: number;
        name: string;
        price_per_day: number;
        images?: { photo: string }[];
    };
    created_at: string;
    updated_at: string;
}

export default function BookingDetailPage() {
    const params = useParams();
    const id = params?.id;
    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        api.get(`/bookings/${id}/`).then(response => {
            setBooking(response.data);
            setLoading(false);
        }).catch(err => {
            if (process.env.NODE_ENV === 'development') console.error(err);
            setLoading(false);
        });
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-sovereign-obsidian">
            <div className="w-16 h-16 border-4 border-sovereign-gold/20 border-t-sovereign-gold rounded-full animate-spin" />
        </div>
    );

    if (!booking) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-sovereign-obsidian p-6 text-center">
            <ShieldCheck className="w-16 h-16 text-red-500/50 mb-4" />
            <h1 className="text-2xl font-black italic text-white">الحجز غير موجود</h1>
            <p className="text-white/40 mt-2">لا يمكن العثور على بروتوكول الحجز المطلوب في السجل السيادي.</p>
        </div>
    );

    const escrowStateMap: Record<string, EscrowState> = {
        INITIATED: 'pending',
        HELD: 'held',
        RELEASED: 'released',
        REFUNDED: 'refunded',
    };

    return (
        <div className="min-h-screen bg-sovereign-obsidian text-sovereign-white font-arabic p-6 md:p-12 lg:p-20 relative overflow-hidden" dir="rtl">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-sovereign-gold/5 rounded-full blur-[160px] opacity-20 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                {/* 🏗️ Navigation & Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <button 
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2 text-white/40 hover:text-sovereign-gold transition-colors text-xs font-black uppercase tracking-widest"
                        >
                            <ChevronLeft className="w-4 h-4 rotate-180" /> عودة للسجل
                        </button>
                        <div className="flex items-center gap-4">
                            <h1 className="text-5xl font-black italic tracking-tighter">
                                بروتوكول <span className="text-sovereign-gold">الحجز.</span>
                            </h1>
                            <Badge className="bg-white/5 border-white/10 text-white/40 px-3 py-1 font-mono text-[10px] tracking-widest">
                                ID #{booking.id.toString().padStart(6, '0')}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-lg font-light italic">
                            سيادة التعاقد: {booking.product?.name}
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-left">
                            <span className="text-[10px] font-black uppercase text-white/30 block mb-1">المبلغ الإجمالي</span>
                            <span className="text-4xl font-black text-white italic">
                                {formatNumber(booking.total_price)} <small className="text-xs text-sovereign-gold uppercase not-italic">DA</small>
                            </span>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <SovereignSeal type="BALANCE_GOLD" refId={`BK-${booking.id}`} size="sm" />
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 📊 main content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* 1. Timeline & Product */}
                        <GlassPanel className="p-10 space-y-10 rounded-[3rem]" gradientBorder>
                            <div className="flex flex-col md:flex-row justify-between gap-12">
                                <div className="space-y-8 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-sovereign-gold/10 rounded-xl flex items-center justify-center text-sovereign-gold">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-2xl font-black italic">الفترة الزمنية</h2>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <span className="text-xs font-black uppercase text-white/20 tracking-widest">تاريخ الاستلام</span>
                                            <p className="text-xl font-bold italic">{new Date(booking.start_date).toLocaleDateString('ar-DZ')}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-xs font-black uppercase text-white/20 tracking-widest">تاريخ الإرجاع</span>
                                            <p className="text-xl font-bold italic">{new Date(booking.end_date).toLocaleDateString('ar-DZ')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-px bg-white/5 hidden md:block" />

                                <div className="space-y-6 flex-1">
                                    <div className="flex items-center gap-4">
                                        {booking.product.images?.[0] && (
                                            <img 
                                                src={booking.product.images[0].photo} 
                                                alt={booking.product.name}
                                                className="w-20 h-20 object-cover rounded-2xl border border-white/10"
                                            />
                                        )}
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase text-sovereign-gold">التفاصيل الفنية</span>
                                            <h3 className="text-xl font-black italic">{booking.product.name}</h3>
                                            <p className="text-xs text-white/40">{booking.product.price_per_day} DA / يوم</p>
                                        </div>
                                    </div>
                                    <SovereignButton variant="secondary" size="sm" className="w-full">
                                        عرض بروتوكول الأصل <ArrowUpRight className="w-4 h-4 ml-2" />
                                    </SovereignButton>
                                </div>
                            </div>
                        </GlassPanel>

                        {/* 2. Agreement Recorder Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h2 className="text-3xl font-black italic tracking-tighter flex items-center gap-4">
                                    ميثاق <span className="text-sovereign-gold">الاتفاق.</span>
                                </h2>
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] uppercase font-black uppercase tracking-widest">
                                    التسجيل الثابت نشط
                                </Badge>
                            </div>
                            <GlassPanel className="p-10 rounded-[3rem]" variant="obsidian" gradientBorder>
                                <AgreementRecorder bookingId={booking.id} />
                            </GlassPanel>
                        </div>
                    </div>

                    {/* 🔒 Sidebar: Financial Vault & Status */}
                    <div className="space-y-8">
                        <h2 className="text-3xl font-black italic tracking-tighter border-b border-white/5 pb-4">
                            خزنة <span className="text-sovereign-gold">السيادة.</span>
                        </h2>

                        <EscrowTracker
                            state={escrowStateMap[booking.escrow_status] || 'pending'}
                            amount={booking.total_price}
                            currency="DA"
                            updatedAt={new Date(booking.updated_at).toLocaleDateString('ar-DZ')}
                        />

                        {/* Additional Sovereign Insight */}
                        <div className="p-8 bg-sovereign-gold/5 border border-sovereign-gold/10 rounded-[2.5rem] flex items-start gap-4">
                            <ShieldCheck className="w-8 h-8 text-sovereign-gold/60 shrink-0" />
                            <div className="space-y-2">
                                <h4 className="font-black italic tracking-tight">بروتوكول النزاهة</h4>
                                <p className="text-xs text-white/40 leading-relaxed italic">
                                    الحجز مسجل في السجل المشفر (Ledger). في حال وجود نزاع، يمكنك تفعيل "وضعية السيادة" للحصول على استشارة فورية من الأوراكل.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🎬 Footer Section: Sovereign Policy Citation */}
                <footer className="pt-20 pb-10 border-t border-white/5 flex flex-col items-center gap-6 text-center">
                    <div className="flex items-center gap-4 opacity-20">
                        <div className="h-px w-20 bg-gradient-to-r from-transparent to-white" />
                        <Lock className="w-4 h-4" />
                        <div className="h-px w-20 bg-gradient-to-l from-transparent to-white" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">
                            STANDARD.Rent | نظام STANDARD.Rent 2026
                        </p>
                        <p className="text-[9px] text-white/10 uppercase tracking-widest">
                            الحقيقة الراديكالية • الأمان المطلق • كود تحفة فنية
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
