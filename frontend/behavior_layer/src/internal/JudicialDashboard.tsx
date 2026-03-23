import React, { useEffect, useState } from 'react';

interface UserContext {
    email: string;
    merit_score: number;
    emotional_lock_until: string | null;
    consecutive_emotional_attempts: number;
    is_verified: boolean;
}

interface EvidenceLog {
    id: number;
    action: string;
    actor_email: string;
    timestamp: string;
    metadata: any;
    hash: string;
}

interface Precedent {
    id: number;
    dispute_title: string;
    verdict: string;
    ruling_summary: string;
    similarity_score: number;
    date: string;
}

interface DisputeDetail {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    user_context: UserContext;
    evidence_trail: EvidenceLog[];
    judgments: any[];
    related_precedents: Precedent[];
}

import { RulingEditor } from './RulingEditor';

export const JudicialDashboard: React.FC<{ disputeId: number }> = ({ disputeId }) => {
    const [dispute, setDispute] = useState<DisputeDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [verdictIssued, setVerdictIssued] = useState(false);

    const fetchDispute = async () => {
        try {
            const response = await fetch(`/api/v1/tribunal/cases/${disputeId}/`);
            const data = await response.json();
            setDispute(data);
        } catch (error) {
            console.error("Error fetching tribunal case:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDispute();
    }, [disputeId]);

    const handleVerdictSuccess = (id: number) => {
        setVerdictIssued(true);
        fetchDispute(); // Refresh to show the new judgment in history
    };

    if (loading) return <div className="p-8 text-center">Loading Procedural Context...</div>;
    if (!dispute) return <div className="p-8 text-center text-red-600">Case Not Found in Jurisdiction.</div>;

    return (
        <div className="judicial-dashboard p-8 bg-slate-50 min-h-screen">
            <header className="mb-8 border-b pb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-serif text-slate-800">Tribunal Case Review: #{dispute.id}</h1>
                    <p className="text-slate-500 font-mono text-sm">{dispute.title}</p>
                </div>
                <div className="status-badge px-4 py-1 bg-slate-200 rounded text-slate-700 font-bold uppercase tracking-widest text-xs">
                    {dispute.status}
                </div>
            </header>

            {verdictIssued && (
                <div className="mb-8 p-4 bg-green-100 border border-green-200 text-green-800 rounded text-center font-bold">
                    Verdict Sealed and Dispatched. The book of this dispute is being closed.
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Right Column: User Context (Soul before Data) */}
                <section className="lg:col-span-1 space-y-6">
                    {/* ... (Human Context Card code remained same) ... */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-amber-500">
                        <h2 className="text-lg font-bold text-slate-700 mb-4 border-b pb-2">Human Context Card</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 uppercase">Subject</label>
                                <p className="text-slate-800 font-medium">{dispute.user_context.email}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase">Merit Integrity Score</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-100 rounded">
                                        <div
                                            className="h-full bg-amber-500 rounded"
                                            style={{ width: `${dispute.user_context.merit_score}%` }}
                                        />
                                    </div>
                                    <span className="font-mono text-sm">{dispute.user_context.merit_score}/100</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 uppercase">Verified</label>
                                    <p className={dispute.user_context.is_verified ? "text-green-600" : "text-amber-600"}>
                                        {dispute.user_context.is_verified ? "Sovereignly Verified" : "Unconfirmed"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase">Lock Progress</label>
                                    <p className="text-slate-700">
                                        {dispute.user_context.emotional_lock_until ? "Active Cool-off" : "Calm State"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-lg shadow-inner text-slate-300">
                        <h3 className="text-xs font-bold uppercase tracking-tighter mb-4 text-slate-500">Philosophical Reminder</h3>
                        <p className="italic text-sm leading-relaxed">
                            "Human Dignity is a hard constraint. The verdict must restore right without destroying the soul of the claimant."
                        </p>
                    </div>
                </section>

                {/* Left/Center Column: Evidence & Case Details */}
                <section className="lg:col-span-2 space-y-8">

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h2 className="text-lg font-bold text-slate-700 mb-4">Case Statement</h2>
                        <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded italic border-l-4 border-slate-300">
                            "{dispute.description}"
                        </p>
                    </div>

                    {/* Precedent Panel (Institutional Memory) */}
                    {dispute.related_precedents && dispute.related_precedents.length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-indigo-500">
                            <h2 className="text-lg font-bold text-slate-700 mb-4 flex justify-between items-center">
                                <span>Institutional Memory</span>
                                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded">Discovery Active</span>
                            </h2>
                            <div className="space-y-4">
                                {dispute.related_precedents.map((prec) => (
                                    <div key={prec.id} className="precedent-card p-4 bg-indigo-50 rounded border border-indigo-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-indigo-900 text-sm">Case #{prec.id}: {prec.dispute_title}</h4>
                                            <span className="text-xs font-mono bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded">
                                                {prec.similarity_score}% Match
                                            </span>
                                        </div>
                                        <div className="text-xs text-indigo-800 mb-2 font-mono">
                                            Verdict: {prec.verdict.replace('_', ' ').toUpperCase()} | Date: {new Date(prec.date).toLocaleDateString()}
                                        </div>
                                        <p className="text-sm text-indigo-700 italic">
                                            "{prec.ruling_summary}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h2 className="text-lg font-bold text-slate-700 mb-4">Evidence Trail (The Black Box)</h2>
                        <div className="space-y-4">
                            {dispute.evidence_trail.map((log) => (
                                <div key={log.id} className="evidence-log flex gap-4 p-4 border rounded hover:border-slate-400 transition-colors">
                                    <div className="timestamp text-xs font-mono text-slate-400 w-32">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm font-bold text-slate-700 uppercase">{log.action}</span>
                                            <span className="text-[10px] font-mono text-slate-300">HASH: {log.hash.substring(0, 16)}...</span>
                                        </div>
                                        <div className="metadata text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                            {JSON.stringify(log.metadata)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* The Gavel - Only show if not already final */}
                    {dispute.status !== 'closed' && dispute.status !== 'judgment_final' && (
                        <>
                            <RulingEditor disputeId={dispute.id} onSuccess={handleVerdictSuccess} />

                            {/* Phase 42: Sovereign Override (The Red Button) */}
                            <div className="mt-12 pt-8 border-t-2 border-red-100">
                                <h3 className="text-red-800 font-serif font-bold text-lg mb-2 flex items-center gap-2">
                                    <span>⚠️ Sovereign Override Protocol</span>
                                </h3>
                                <p className="text-red-700/70 text-sm mb-4">
                                    Use only in event of procedural deadlock or sovereign necessity.
                                    Bypasses all appeal windows and forces immediate finality.
                                    Action is logged permanently in the Evidence Vault.
                                </p>
                                <button
                                    onClick={() => {
                                        const justification = prompt("CONSTITUTIONAL JUSTIFICATION REQUIRED:\n\nWhy must this dispute be force-resolved? (This will be logged)");
                                        if (justification) {
                                            const amount = prompt("Awarded Amount (DZD):", "0");
                                            const verdict = prompt("Verdict (favor_owner, favor_tenant, split, dismissed):", "dismissed");

                                            if (amount && verdict) {
                                                fetch(`/api/v1/judicial/disputes/${dispute.id}/override/`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${localStorage.getItem('token')}` // Assumes standard JWT
                                                    },
                                                    body: JSON.stringify({
                                                        justification,
                                                        awarded_amount: parseFloat(amount),
                                                        verdict,
                                                        ruling_text: `SOVEREIGN OVERRIDE: ${justification}`
                                                    })
                                                })
                                                    .then(res => res.json())
                                                    .then(data => {
                                                        if (data.code === 'SOVEREIGN_OVERRIDE_EXECUTED') {
                                                            alert("Sovereign Override Executed. Dispute Finalized.");
                                                            handleVerdictSuccess(data.judgment_id);
                                                        } else {
                                                            alert("Error: " + (data.error || "Unknown error"));
                                                        }
                                                    });
                                            }
                                        }
                                    }}
                                    className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded hover:bg-red-800 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"
                                >
                                    Initiate Force Resolution
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
};
