'use client';
import React, { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';

interface VouchButtonProps {
    targetUserId: number;
    viewerRiskScore: number; // Passed from parent or context
    initialVouchCount?: number;
}

export const VouchButton = ({ targetUserId, viewerRiskScore, initialVouchCount = 0 }: VouchButtonProps) => {
    const [isVouched, setIsVouched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [vouchCount, setVouchCount] = useState(initialVouchCount);

    // Only Golden Users (Risk Score <= 20) can vouch
    // 50 is base, so <50 is good, <=20 is Golden.
    if (viewerRiskScore > 20) {
        return null; // Invisible to non-golden users
    }

    const handleVouch = async () => {
        setIsLoading(true);
        try {
            await api.post(`/social/vouch/${targetUserId}/`);
            toast.success("تمت تزكية المستخدم بنجاح! 🌟", {
                description: "لقد ساهمت في رفع الثقة في المجتمع."
            });
            setIsVouched(true);
            setVouchCount(prev => prev + 1);
        } catch (error: any) {
            console.error("Vouch error:", error);
            if (error.response?.status === 400) {
                toast.error("لقد قمت بتزكية هذا المستخدم بالفعل.");
                setIsVouched(true); // Assume already vouched
            } else {
                toast.error("فشلت العملية. حاول مرة أخرى.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isVouched) {
        return (
            <div className="flex items-center text-green-600 gap-2 bg-green-50 px-3 py-1 rounded-full text-sm font-bold border border-green-200">
                <ShieldCheck className="w-4 h-4" />
                <span>تمت التزكية</span>
            </div>
        );
    }

    return (
        <button
            onClick={handleVouch}
            disabled={isLoading}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-md
                ${isLoading
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#d4af37] to-[#f1c40f] text-white hover:shadow-lg hover:scale-105 active:scale-95'
                }
            `}
        >
            <ShieldCheck className="w-5 h-5" />
            <span>{isLoading ? 'جاري التزكية...' : 'تزكية (Vouch)'}</span>
        </button>
    );
};
