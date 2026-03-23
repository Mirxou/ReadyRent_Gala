
'use client';

import React from 'react';
import { SovereignSeal } from '../../components/sovereign/SovereignSeal';

interface SovereignVerdictProps {
    data: {
        status: string;
        code: string;
        dispute_id: number;
        verdict?: {
            title_ar: string;
            body_ar: string;
            type: 'favor_tenant' | 'favor_owner' | 'dismissed' | 'split';
            awarded_amount?: number;
        };
        visual_assets?: {
            seal?: { type: string };
        };
    };
    onClose: () => void;
}

export const SovereignVerdict: React.FC<SovereignVerdictProps> = ({ data, onClose }) => {
    const isSuccess = data.verdict?.type === 'favor_tenant' || data.verdict?.type === 'favor_owner';
    const isDismissed = data.verdict?.type === 'dismissed';

    const handleClose = async () => {
        try {
            await fetch(`http://127.0.0.1:8000/api/v1/judicial/disputes/${data.dispute_id}/close/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            onClose(); // Reset parent state
        } catch (e) {
            console.error("Failed to close archive", e);
        }
    };

    const handleAppeal = async () => {
        const reason = window.prompt("يرجى ذكر سبب الاعتراض (حق سيادي):");
        if (!reason) return;

        try {
            await fetch(`http://127.0.0.1:8000/api/v1/judicial/disputes/${data.dispute_id}/appeal/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            onClose(); // Appeal kicks it back to "Proceeding" state in parent
        } catch (e) {
            console.error("Appeal failed", e);
        }
    };

    // Labels mapping from RESOLUTION_ETHICS.md
    const labels = {
        favor_tenant: {
            status_ar: "ثبوت الادعاء",
            action_ar: "تمت استعادة الحق",
            theme: "text-amber-700 bg-amber-50 border-amber-200"
        },
        favor_owner: {
            status_ar: "ثبوت الادعاء",
            action_ar: "تمت استعادة الحق",
            theme: "text-amber-700 bg-amber-50 border-amber-200"
        },
        dismissed: {
            status_ar: "لم يثبت الادعاء",
            action_ar: "البيينة لم تكتمل",
            theme: "text-slate-600 bg-slate-50 border-slate-200"
        },
        split: {
            status_ar: "توافق مرضي",
            action_ar: "إغلاق توافقي",
            theme: "text-slate-700 bg-slate-50 border-slate-200"
        }
    };

    const currentTheme = labels[data.verdict?.type || 'split'];

    return (
        <div className="max-w-2xl mx-auto mt-10 p-1 bg-white rounded-xl shadow-2xl relative overflow-hidden transition-all duration-1000 ease-in-out">
            {/* Sovereign Top Bar */}
            <div className={`h-2 w-full ${isSuccess ? 'bg-amber-400' : 'bg-slate-300'}`}></div>

            <div className="p-8">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <div className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400 mb-1">Final Judgment</div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">قضاء النواة الرصين</h1>
                    </div>
                    {data.visual_assets?.seal && (
                        <SovereignSeal type={data.visual_assets.seal.type} refId={`VERD-${data.dispute_id}`} />
                    )}
                </div>

                <div className={`p-6 rounded-lg border ${currentTheme.theme} mb-8`}>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{isSuccess ? '⚖️' : '📖'}</span>
                        <h2 className="text-xl font-bold">{currentTheme.status_ar}</h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-lg leading-relaxed opacity-90">
                            {data.verdict?.body_ar || "تمت مراجعة كافة الأدلة والشهادات بدقة تامة."}
                        </p>

                        {data.verdict?.awarded_amount && (
                            <div className="mt-4 pt-4 border-t border-current border-opacity-20 flex justify-between items-center">
                                <span className="text-sm font-medium uppercase tracking-wider opacity-70">Awarded Amount</span>
                                <span className="text-2xl font-bold">{data.verdict.awarded_amount} ريال</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-100 italic text-center text-gray-600">
                    "{currentTheme.action_ar}"
                </div>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={handleClose}
                        className="w-full py-4 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition-colors shadow-lg"
                    >
                        إغلاق الملف والأرشفة
                    </button>

                    <div className="text-center">
                        <button
                            onClick={handleAppeal}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest py-2"
                        >
                            حق الاعتراض (Friction Lock 48h)
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-between items-center">
                <span className="text-[10px] font-mono text-gray-400 uppercase">Ref: {data.dispute_id}</span>
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Standard.Rent Resolution Protocol</span>
            </div>
        </div>
    );
};
