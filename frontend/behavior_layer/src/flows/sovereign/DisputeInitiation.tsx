
'use client';

import React, { useState } from 'react';
import { SovereignSeal } from '../../components/sovereign/SovereignSeal';
import { JusticeReceipt } from '../../components/sovereign/JusticeReceipt';
import { SovereignVerdict } from './SovereignVerdict';
import { MediationPanel } from '../../components/mediation/MediationPanel';

// Types (should ideally come from shared contracts, but inline for prototype)
interface VisualAssets {
    mode: 'MARKET' | 'DISPUTE' | 'VERDICT';
    seal?: { type: string };
    receipt?: { stages: any[] };
}

interface SovereignResponse {
    status: string;
    code: string;
    dignity_preserved: boolean;
    visual_assets?: VisualAssets;
    verdict?: any; // For Halt/Verdict
    requirements?: any[]; // For Conditional
    metadata?: any;
    dispute_id?: number;
    current_phase?: string;
}

export const DisputeInitiation: React.FC = () => {
    const [responseData, setResponseData] = useState<SovereignResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isPolling, setIsPolling] = useState(false);

    const API_BASE_URL = 'http://127.0.0.1:8000'; // TODO: Move to env

    const refreshStatus = async (id: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/judicial/disputes/${id}/status/`);
            const data = await response.json();
            setResponseData(data);

            if (data.visual_assets?.mode) {
                document.body.className = `mode-${data.visual_assets.mode.toLowerCase()}`;
            }

            if (data.current_phase === 'judgment_provisional') {
                setIsPolling(false);
            }
        } catch (e) {
            console.error("Refresh failed", e);
        }
    };

    const handleSubmit = async (emotionalState: string) => {
        setLoading(true);
        setError(null);
        try {
            // Assuming backend is running on port 8000
            const response = await fetch(`${API_BASE_URL}/api/v1/judicial/disputes/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emotional_state: emotionalState,
                    title: title || 'UNAFFILIATED_DISPUTE',
                    description: description,
                    priority: 'medium'
                })
            });

            const data = await response.json();
            setResponseData(data);

            // Apply visual mode via CSS class on body (simulated for now by state/wrapper or direct DOM manipulation for prototype)
            if (data.visual_assets?.mode) {
                document.body.className = `mode-${data.visual_assets.mode.toLowerCase()}`;
            } else {
                document.body.className = '';
            }

            // If proceeding, start polling for status changes (judicial deliberation)
            if (data.status === 'sovereign_proceeding' && data.dispute_id) {
                setIsPolling(true);
            }

        } catch (e) {
            console.error("Failed to fetch", e);
            setError("Failed to connect to Sovereign Core. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    // Polling effect
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        const id = responseData?.dispute_id;
        if (isPolling && id) {
            interval = setInterval(() => {
                refreshStatus(id);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isPolling, responseData?.dispute_id]);

    const reset = () => {
        setResponseData(null);
        setIsPolling(false);
        document.body.className = '';
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="animate-pulse text-lg text-gray-500">جاري الاتصال بالنواة السيادية...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                    onClick={() => setError(null)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                    Retry
                </button>
            </div>
        )
    }

    // --- STATE 1: SOVEREIGN HALT (Cooling Off) ---
    if (responseData?.status === 'sovereign_halt') {
        return (
            <div className="flex flex-col items-center">
                <CoolingOffScreen data={responseData} onReset={reset} />
            </div>
        );
    }

    // --- STATE 2: SOVEREIGN CONDITIONAL (Structured Form) ---
    if (responseData?.status === 'sovereign_conditional') {
        return (
            <div className="p-8 max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-orange-200">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">متطلبات إضافية</h2>
                        <p className="text-gray-600">لضمان جدية الطلب، يرجى استيفاء الشروط التالية:</p>
                    </div>
                    {responseData.visual_assets?.seal && (
                        <SovereignSeal type={responseData.visual_assets.seal.type} refId={`COND-${Date.now()}`} />
                    )}
                </div>

                <div className="space-y-4 mb-8">
                    {responseData.requirements?.map((req: any, i: number) => (
                        <div key={i} className="p-4 bg-orange-50 rounded border border-orange-100 flex items-center gap-3">
                            <span className="text-orange-500 font-bold">⚠️</span>
                            <span>{req.description} ({req.min_count} required)</span>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={reset} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
                    <button className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 opacity-50 cursor-not-allowed">
                        Submit Evidence
                    </button>
                </div>
            </div>
        )
    }

    // --- STATE 3.1: SOVEREIGN VERDICT (Resolution Reached) ---
    if (responseData?.current_phase === 'judgment_provisional') {
        return <SovereignVerdict data={responseData as any} onClose={reset} />;
    }

    // --- STATE 3.2: SOVEREIGN MEDIATION (Benevolent Intervention) ---
    if (responseData?.current_phase === 'mediation_active') {
        return (
            <div className="flex flex-col items-center mt-10">
                <MediationPanel
                    disputeId={responseData.dispute_id!}
                    onComplete={() => refreshStatus(responseData.dispute_id!)}
                />
            </div>
        );
    }

    // --- STATE 3: SOVEREIGN PROCEEDING (Judicial Process) ---
    if (responseData?.status === 'sovereign_proceeding') {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                    <div>
                        <h1 className="text-2xl font-bold text-emerald-800 mb-1">العملية القضائية نشطة</h1>
                        <p className="text-emerald-600 font-mono text-sm">{responseData.code || 'IN_REVIEW'}</p>
                    </div>
                    {responseData.visual_assets?.seal && (
                        <SovereignSeal type={responseData.visual_assets.seal.type} refId={`PROC-${Date.now()}`} />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100">
                            <h3 className="font-bold text-emerald-900 mb-2">تعليمات السيادة</h3>
                            <p className="text-emerald-800 leading-relaxed">
                                تم قبول طلبك وهو الآن قيد المراجعة القضائية. يرجى الانتظار حتى اكتمال مرحلة الفحص الأولي.
                                النظام سيقوم بإشعارك عند حدوث أي مستجدات.
                            </p>
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        {responseData.visual_assets?.receipt && (
                            <JusticeReceipt stages={responseData.visual_assets.receipt.stages} />
                        )}
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <button onClick={reset} className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50">
                        عودة للرئيسية
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">بدء إجراء قضائي (Sovereign Flow)</h1>

            <div className="space-y-4 mb-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">عنوان النزاع</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="مثلاً: تلف في المثقاب الكهربائي"
                        className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">وصف المشكلة</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="يرجى وصف ما حدث بكل هدوء..."
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            <p className="mb-6 text-gray-600 text-sm">
                النواة السيادية ستقوم بتحليل بياناتك وحالتك العاطفية لتحديد المسار القانوني المناسب.
            </p>

            <div className="grid grid-cols-1 gap-4">
                <button
                    disabled={!description}
                    className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${!description ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleSubmit('angry')}
                >
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        😡
                    </span>
                    إرسال بغضب (Trigger Cooling Off)
                </button>

                <button
                    disabled={!description}
                    className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${!description ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleSubmit('calm')}
                >
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        ⚖️
                    </span>
                    إرسال بهدوء (Trigger Proceeding)
                </button>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100">
                <p className="text-xs text-center text-gray-400 font-mono">SOVEREIGN API PROTOCOL v1.0</p>
            </div>
        </div>
    );
};

const CoolingOffScreen: React.FC<{ data: any, onReset: () => void }> = ({ data, onReset }) => {
    return (
        <div className="cooling-off-screen p-8 bg-slate-50 border border-slate-200 rounded-lg max-w-md mx-auto mt-10 shadow-lg relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-300"></div>

            <div className="flex justify-center mb-6">
                {data.visual_assets?.seal && (
                    <SovereignSeal type={data.visual_assets.seal.type} refId="HALT-001" />
                )}
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-3 text-center">{data.verdict.title_ar}</h2>

            <div className="bg-white p-6 rounded border border-slate-100 mb-6">
                <p className="text-slate-600 text-center leading-relaxed text-lg">
                    {data.verdict.body_ar}
                </p>
            </div>

            <div className="flex flex-col items-center gap-2 mb-8">
                <span className="text-xs text-slate-400 uppercase tracking-widest">Unlocks At</span>
                <span className="font-mono text-xl text-slate-700 bg-slate-100 px-3 py-1 rounded">
                    {new Date(data.verdict.unlocks_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            <button
                onClick={onReset}
                className="w-full py-3 text-slate-500 hover:text-slate-800 transition-colors border-t border-slate-200"
            >
                أقر وأتفهم (عودة)
            </button>
        </div>
    );
};
