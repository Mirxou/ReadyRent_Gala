'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { FileSignature, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { arDZ } from 'date-fns/locale';

interface AgreementWidgetProps {
    agreement: {
        id: number;
        buyer: number;
        seller: number;
        status: string;
        buyer_signed_at: string | null;
        seller_signed_at: string | null;
        digital_signature_hash: string | null;
        created_at: string;
    };
    currentUserId: number;
    onAgreementUpdated: (updatedAgreement: any) => void;
}

export const AgreementWidget = ({ agreement, currentUserId, onAgreementUpdated }: AgreementWidgetProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const isBuyer = currentUserId === agreement.buyer;
    const isSeller = currentUserId === agreement.seller;
    const isParticipant = isBuyer || isSeller;

    const hasSigned = (isBuyer && agreement.buyer_signed_at) || (isSeller && agreement.seller_signed_at);
    const isFullySigned = agreement.status === 'ACCEPTED';

    const handleSign = async () => {
        setIsLoading(true);
        try {
            const res = await api.post(`/contracts/sign/${agreement.id}/`);
            toast.success("تم توقيع الاتفاق بنجاح! ✍️", {
                description: "تم تسجيل توقيعك الرقمي وتوثيقه."
            });
            onAgreementUpdated(res.data);
        } catch (error: any) {
            console.error("Sign error:", error);
            toast.error("فشل التوقيع. حاول مرة أخرى.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!agreement) return null;

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-gala-purple/5 to-gala-gold/5 opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <FileSignature className="w-6 h-6 text-gala-gold" />
                        <span>توثيق الاتفاق (Double Auth)</span>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        مطلوب توقيع الطرفين لتفعيل العقد الذكي.
                    </p>
                </div>

                {isFullySigned ? (
                    <div className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full border border-green-500/20 flex items-center gap-2 text-sm font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>موثق بالكامل</span>
                    </div>
                ) : (
                    <div className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20 flex items-center gap-2 text-sm font-bold animate-pulse">
                        <Clock className="w-4 h-4" />
                        <span>بانتظار التوقيع</span>
                    </div>
                )}
            </div>

            {/* Signature Status Steps */}
            <div className="grid grid-cols-2 gap-4 relative z-10">
                {/* Buyer Status */}
                <div className={cn(
                    "p-4 rounded-xl border transition-all duration-300",
                    agreement.buyer_signed_at
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-white/5 border-dashed border-white/20"
                )}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center",
                            agreement.buyer_signed_at ? "bg-green-500 text-white" : "bg-gray-700 text-gray-400"
                        )}>
                            {agreement.buyer_signed_at ? <CheckCircle2 className="w-5 h-5" /> : "1"}
                        </div>
                        <div>
                            <p className="font-bold text-sm">المستأجر (Buyer)</p>
                            <p className="text-xs text-muted-foreground">
                                {agreement.buyer_signed_at
                                    ? format(new Date(agreement.buyer_signed_at), 'd MMM, HH:mm', { locale: arDZ })
                                    : 'لم يوقع بعد'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Seller Status */}
                <div className={cn(
                    "p-4 rounded-xl border transition-all duration-300",
                    agreement.seller_signed_at
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-white/5 border-dashed border-white/20"
                )}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center",
                            agreement.seller_signed_at ? "bg-green-500 text-white" : "bg-gray-700 text-gray-400"
                        )}>
                            {agreement.seller_signed_at ? <CheckCircle2 className="w-5 h-5" /> : "2"}
                        </div>
                        <div>
                            <p className="font-bold text-sm">المؤجر (Seller)</p>
                            <p className="text-xs text-muted-foreground">
                                {agreement.seller_signed_at
                                    ? format(new Date(agreement.seller_signed_at), 'd MMM, HH:mm', { locale: arDZ })
                                    : 'لم يوقع بعد'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Area */}
            {isParticipant && !hasSigned && !isFullySigned && (
                <button
                    onClick={handleSign}
                    disabled={isLoading}
                    className="relative z-10 w-full py-3 bg-gradient-to-r from-gala-gold to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <span className="animate-pulse">جاري التوقيع الرقمي...</span>
                    ) : (
                        <>
                            <FileSignature className="w-5 h-5" />
                            <span>توقيع الاتفاق الآن</span>
                        </>
                    )}
                </button>
            )}

            {/* Digital Hash Proof */}
            {isFullySigned && agreement.digital_signature_hash && (
                <div className="relative z-10 p-3 bg-black/20 rounded-lg border border-white/5 font-mono text-[10px] text-muted-foreground break-all text-center">
                    <div className="flex items-center justify-center gap-2 mb-1 text-gala-cyan">
                        <ShieldCheck className="w-3 h-3" />
                        <span className="uppercase tracking-widest font-bold">SHA-256 Proof</span>
                    </div>
                    {agreement.digital_signature_hash}
                </div>
            )}
        </div>
    );
};
