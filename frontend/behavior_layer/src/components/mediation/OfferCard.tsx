
import React from 'react';

interface OfferCardProps {
    offer: {
        id: number;
        source: 'system' | 'admin';
        amount: number;
        reasoning: string;
        created_at: string;
        // Phase 43: Explainability
        confidence_min?: number;
        confidence_max?: number;
        explainability_version?: string;
    };
    onAccept: (offerId: number) => void;
    onReject: () => void;
}

/**
 * Parse structured explanation into sections (Phase 43)
 */
const parseExplanation = (reasoning: string) => {
    const sections: { title: string; content: string }[] = [];

    // Split by section headers
    const parts = reasoning.split(/\n\n(?=WHY THIS VALUE:|REFERENCE CASES:|CONFIDENCE RANGE:)/);

    parts.forEach(part => {
        const match = part.match(/^(WHY THIS VALUE|REFERENCE CASES|CONFIDENCE RANGE):\s*\n?([\s\S]+)$/);
        if (match) {
            sections.push({
                title: match[1],
                content: match[2].trim()
            });
        } else if (part.trim()) {
            // Fallback for unstructured content
            sections.push({
                title: 'EXPLANATION',
                content: part.trim()
            });
        }
    });

    return sections;
};

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onAccept, onReject }) => {
    const sections = parseExplanation(offer.reasoning);
    const hasConfidence = offer.confidence_min !== undefined && offer.confidence_max !== undefined;

    return (
        <div className="bg-white rounded-lg border border-indigo-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-xs font-mono uppercase tracking-widest text-indigo-500 mb-1">
                            {offer.source === 'system' ? 'Sovereign Proposal' : 'Administrative Offer'}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">عرض تسوية مقترح</h3>
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold font-mono">
                        FAIR VALUE
                    </div>
                </div>

                {/* Phase 43: Confidence Range Display */}
                {hasConfidence && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-bold text-amber-800">نطاق التقدير القضائي</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-amber-700">
                                {offer.confidence_min?.toLocaleString()} - {offer.confidence_max?.toLocaleString()} DZD
                            </span>
                            <span className="text-xs text-amber-600">بناءً على تباين القضايا السابقة</span>
                        </div>
                    </div>
                )}

                {/* Phase 43: Structured Explanation Sections */}
                <div className="mb-6 space-y-4">
                    {sections.map((section, idx) => (
                        <div key={idx} className="border-l-2 border-indigo-200 pl-3">
                            <h4 className="text-xs font-mono text-indigo-600 mb-1">{section.title}</h4>
                            <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                                {section.content}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Proposed Amount (Prominent) */}
                <div className="bg-gray-50 rounded p-4 mb-6 flex justify-between items-center border border-gray-100">
                    <span className="text-sm text-gray-500 font-medium">مبلغ التسوية المقترح</span>
                    <span className="text-2xl font-bold text-gray-900">{parseFloat(offer.amount.toString()).toLocaleString()} DZD</span>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => onAccept(offer.id)}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-md font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                        قبول العرض وإنهاء النزاع
                    </button>
                    <button
                        onClick={onReject}
                        className="px-4 py-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                        رفض
                    </button>
                </div>
                <div className="mt-3 text-center">
                    <p className="text-[10px] text-gray-400">
                        بقبولك لهذا العرض، يتم إغلاق ملف النزاع فوراً وتحويل المبلغ المستحق.
                    </p>
                </div>
            </div>
        </div>
    );
};
