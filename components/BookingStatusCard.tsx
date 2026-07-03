'use client';
import React from 'react';

// Define Escrow Status types (matching Backend choices)
type EscrowStatus = 'INITIATED' | 'HELD' | 'RELEASED' | 'REFUNDED';

interface BookingStatusProps {
    status: EscrowStatus;
    amount: number;
    releaseDate?: string;
}

export const BookingStatusCard = ({ status, amount, releaseDate }: BookingStatusProps) => {
    // Helper for Colors
    const getStatusColor = () => {
        switch (status) {
            case 'HELD': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'RELEASED': return 'bg-green-50 text-green-700 border-green-200';
            case 'REFUNDED': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700'; // INITIATED or others
        }
    };

    // Helper for Text
    const getStatusText = () => {
        switch (status) {
            case 'HELD': return '💰 المال في الخزنة الآمنة (Escrow Held)';
            case 'RELEASED': return '✅ تم التسليم وإطلاق المال';
            case 'REFUNDED': return '↩️ تم الإرجاع والحساب معاد';
            case 'INITIATED': return '⏳ جاري بدء إجراءات الحجز...';
            default: return 'جاري المعالجة...';
        }
    };

    return (
        <div className={`p-4 rounded-lg border shadow-sm transition-all ${getStatusColor()}`}>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold font-['IBM_Plex_Sans_Arabic']">
                    حالة الحجز المالي
                </h3>
                <span className="text-2xl font-bold">{amount} دج</span>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-semibold">{getStatusText()}</p>

                {status === 'HELD' && (
                    <p className="text-xs text-gray-500 mt-2">
                        سيتم صرف المال تلقائياً للمالك بمجرد تأكيد استلام الفستان.
                    </p>
                )}

                {releaseDate && status === 'RELEASED' && (
                    <p className="text-xs text-gray-500 mt-2">
                        تم الصرف في: {new Date(releaseDate).toLocaleString('ar-DZ')}
                    </p>
                )}
            </div>
        </div>
    );
};
