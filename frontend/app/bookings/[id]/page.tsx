'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { BookingStatusCard } from '@/components/BookingStatusCard';
import { AgreementRecorder } from '@/components/AgreementRecorder';

interface BookingDetail {
    id: number;
    start_date: string;
    end_date: string;
    total_price: number;
    status: string;
    escrow_status: 'HELD' | 'RELEASED' | 'REFUNDED' | 'INITIATED';
    vault_address?: string;
    product: {
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
        // Fetch real booking details
        api.get(`/bookings/${id}/`).then(response => {
            setBooking(response.data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [id]);

    if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;
    if (!booking) return <div className="p-8 text-center text-red-500">الحجز غير موجود</div>;

    return (
        <div className="container mx-auto p-6 space-y-8 max-w-5xl">

            {/* 1. Page Header */}
            <header className="border-b pb-4 mb-6">
                <h1 className="text-3xl font-bold text-[#2c3e50] font-['IBM_Plex_Sans_Arabic']">
                    حجز #{booking.id} - {booking.product?.name}
                </h1>
                <p className="text-gray-600 mt-2">
                    من {new Date(booking.start_date).toLocaleDateString('ar-DZ')} إلى {new Date(booking.end_date).toLocaleDateString('ar-DZ')}
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* 2. Financial Profile (The Vault) */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4 text-[#2c3e50] font-['IBM_Plex_Sans_Arabic']">الملف المالي (Bank)</h2>
                    <BookingStatusCard
                        status={booking.escrow_status}
                        amount={booking.total_price}
                        releaseDate={booking.updated_at}
                    />

                    {/* Product Summary Mini-Card */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4 flex gap-4">
                        {booking.product.images && booking.product.images[0] && (
                            <img
                                src={booking.product.images[0].photo}
                                alt={booking.product.name}
                                className="w-16 h-16 object-cover rounded"
                            />
                        )}
                        <div>
                            <p className="font-bold">{booking.product.name}</p>
                            <p className="text-sm text-gray-500">{booking.total_price} دج</p>
                        </div>
                    </div>
                </div>

                {/* 3. Agreement & Conditions (The Contract) */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4 text-[#2c3e50] font-['IBM_Plex_Sans_Arabic']">الاتفاقية والشروط (Contract)</h2>

                    {/* Integrated Voice Recorder */}
                    <AgreementRecorder bookingId={booking.id} />
                </div>
            </div>

            {/* 4. Footer */}
            <footer className="mt-12 pt-6 border-t text-center text-sm text-gray-500 font-['IBM_Plex_Sans_Arabic']">
                <p>منصة STANDARD.Rent | STANDARD | الاقتصاد المنظم ذاتياً</p>
            </footer>
        </div>
    );
}
