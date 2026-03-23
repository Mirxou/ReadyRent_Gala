import React, { useState } from 'react';

interface RulingEditorProps {
    disputeId: number;
    onSuccess: (judgmentId: number) => void;
}

export const RulingEditor: React.FC<RulingEditorProps> = ({ disputeId, onSuccess }) => {
    const [verdict, setVerdict] = useState('favor_tenant');
    const [rulingText, setRulingText] = useState('');
    const [awardedAmount, setAwardedAmount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const guards = [
        { label: "Right Restored", text: "تمت استعادة الحق" },
        { label: "Claim Unsubstantiated", text: "لم يثبت الادعاء" },
        { label: "Evidence Insufficient", text: "البيينة لم تكتمل" },
        { label: "Mutual Resolution", text: "توافق مرضي" }
    ];

    const handleSubmit = async () => {
        if (!rulingText) return alert("A ruling requires formal reasoning.");

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/v1/judicial/disputes/${disputeId}/verdict/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    verdict,
                    ruling_text: rulingText,
                    awarded_amount: awardedAmount
                })
            });
            const data = await response.json();
            if (data.judgment_id) {
                onSuccess(data.judgment_id);
            } else {
                alert(data.error || "Submission Failed");
            }
        } catch (error) {
            console.error("Error issuing verdict:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="ruling-editor bg-white p-6 rounded-lg shadow-sm border border-slate-200 mt-8">
            <h2 className="text-xl font-serif text-slate-800 mb-6">Issuance of Judicial Opinion</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Verdict Type</label>
                    <select
                        value={verdict}
                        onChange={(e) => setVerdict(e.target.value)}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                        <option value="favor_tenant">Favor Tenant (ثبوت الحق للمستأجر)</option>
                        <option value="favor_owner">Favor Owner (ثبوت الحق للمالك)</option>
                        <option value="split">Split Decision (توافق مرضي)</option>
                        <option value="dismissed">Dismissed (عدم ثبوت الادعاء)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Awarded Amount (if applicable)</label>
                    <input
                        type="number"
                        value={awardedAmount}
                        onChange={(e) => setAwardedAmount(Number(e.target.value))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                    />
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Linguistic Guards (Quick Insert)</label>
                <div className="flex flex-wrap gap-2">
                    {guards.map((guard) => (
                        <button
                            key={guard.label}
                            onClick={() => setRulingText(prev => prev + (prev ? " " : "") + guard.text)}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full transition-colors"
                        >
                            {guard.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Formal Reasoning (Arabic Preferred)</label>
                <textarea
                    value={rulingText}
                    onChange={(e) => setRulingText(e.target.value)}
                    dir="rtl"
                    placeholder="اكتب مسببات الحكم هنا..."
                    className="w-full h-40 p-4 border rounded focus:ring-2 focus:ring-amber-500 outline-none text-lg italic"
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-4 rounded font-bold hover:bg-black transition-all disabled:bg-slate-300"
            >
                {isSubmitting ? "Seal in Progress..." : "Issue Sovereign Verdict"}
            </button>
        </div>
    );
};
