import React, { useEffect, useState } from 'react';

interface AnonymizedCase {
    judgment_hash: string;
    category: string;
    dispute_type: string;
    ruling_summary: string;
    verdict: string;
    consistency_score: number;
    judgment_date: string;
}

interface PublicMetric {
    metric_type: string;
    category: string;
    period_start: string;
    period_end: string;
    value_numeric: string | null;
    value_json: any;
    context: string;
    counter_narrative: string;
}

export const PublicLedger: React.FC = () => {
    const [cases, setCases] = useState<AnonymizedCase[]>([]);
    const [metrics, setMetrics] = useState<PublicMetric[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [casesRes, metricsRes] = await Promise.all([
                    fetch('/api/v1/public/ledger/'),
                    fetch('/api/v1/public/metrics/')
                ]);

                const casesData = await casesRes.json();
                const metricsData = await metricsRes.json();

                setCases(casesData.results || casesData);
                setMetrics(metricsData.results || metricsData);
            } catch (error) {
                console.error("Error fetching public data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center font-serif">Retrieving Transcripts of Justice...</div>;

    return (
        <div className="public-ledger p-8 bg-white min-h-screen">
            <header className="mb-12 text-center">
                <h1 className="text-3xl font-serif text-slate-900 mb-2 uppercase tracking-widest">
                    The Public Ledger
                </h1>
                <div className="h-1 w-24 bg-amber-500 mx-auto mb-4"></div>
                <p className="text-slate-500 italic max-w-2xl mx-auto">
                    "Transparency is the guard of the Law. This ledger provides de-identified evidence of consistency and procedural fairness for all participants."
                </p>
            </header>

            {/* Metrics Dashboard */}
            <section className="mb-16">
                <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Institutional Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {metrics.map((metric, idx) => (
                        <div key={idx} className="metric-card p-6 bg-slate-50 border rounded-lg hover:shadow-md transition-shadow">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">
                                {metric.metric_type.replace(/_/g, ' ')}
                            </h3>
                            <div className="text-4xl font-mono text-slate-900 mb-4">
                                {metric.value_numeric ? `${metric.value_numeric}%` : '---'}
                            </div>
                            <div className="context-card text-sm text-slate-600 border-t pt-4">
                                <p className="mb-2 font-medium">Context:</p>
                                <p className="italic">"{metric.context}"</p>
                            </div>
                        </div>
                    ))}
                    {metrics.length === 0 && (
                        <div className="col-span-full p-8 text-center text-slate-400 bg-slate-50 rounded italic border-dashed border-2">
                            Dashboard analytics are pre-computing...
                        </div>
                    )}
                </div>
            </section>

            {/* Case History */}
            <section>
                <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Recent Dispatches</h2>
                <div className="space-y-6">
                    {cases.map((c) => (
                        <div key={c.judgment_hash} className="case-dispatch p-6 border-l-4 border-slate-200 bg-white shadow-sm hover:border-amber-500 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800">{c.dispute_type}</h4>
                                    <span className="text-xs font-mono text-slate-400 uppercase">{c.category}</span>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${c.verdict === 'favor_tenant' ? 'bg-green-100 text-green-800' :
                                            c.verdict === 'favor_owner' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                                        }`}>
                                        {c.verdict.replace('_', ' ')}
                                    </span>
                                    <div className="text-[10px] font-mono text-slate-300 mt-2">HASH: {c.judgment_hash.substring(0, 16)}...</div>
                                </div>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4 italic">
                                "{c.ruling_summary}"
                            </p>
                            <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                                <span>Date: {new Date(c.judgment_date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    CONSISTENCY: {c.consistency_score}%
                                </span>
                            </div>
                        </div>
                    ))}
                    {cases.length === 0 && (
                        <div className="p-12 text-center text-slate-400 font-serif italic">
                            The Ledger is currently silent. No judgments have been finalized in this period.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
