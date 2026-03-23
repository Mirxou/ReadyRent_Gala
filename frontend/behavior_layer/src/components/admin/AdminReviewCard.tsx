
import React from 'react';

interface AdminReviewCardProps {
    offer: {
        id: number;
        amount: number;
        reasoning: string;
        confidence_min?: number;
        confidence_max?: number;
        created_at: string;
        session: {
            id: number;
            dispute: {
                id: number;
                title: string;
            }
        }
    };
    onApprove: (offerId: number) => void;
    onReject: (offerId: number) => void;
}

const parseExplanation = (reasoning: string) => {
    const sections: { title: string; content: string }[] = [];
    const parts = reasoning.split(/\n\n(?=WHY THIS VALUE:|REFERENCE CASES:|CONFIDENCE RANGE:)/);

    parts.forEach(part => {
        const match = part.match(/^(WHY THIS VALUE|REFERENCE CASES|CONFIDENCE RANGE):\s*\n?([\s\S]+)$/);
        if (match) {
            sections.push({ title: match[1], content: match[2].trim() });
        } else if (part.trim()) {
            sections.push({ title: 'EXPLANATION', content: part.trim() });
        }
    });
    return sections;
};

export const AdminReviewCard: React.FC<AdminReviewCardProps> = ({ offer, onApprove, onReject }) => {
    const sections = parseExplanation(offer.reasoning);

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <span className="text-xs font-mono text-gray-500 uppercase">Dispute #{offer.session.dispute.id}</span>
                    <h3 className="text-sm font-bold text-gray-900">{offer.session.dispute.title}</h3>
                </div>
                <div className="text-right">
                    <span className="text-xs text-gray-400 block">{new Date(offer.created_at).toLocaleDateString()}</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">PENDING REVIEW</span>
                </div>
            </div>

            <div className="p-4">
                {/* Metrics */}
                <div className="flex gap-4 mb-4">
                    <div className="flex-1 bg-indigo-50 rounded p-3 border border-indigo-100">
                        <span className="block text-xs text-indigo-500 uppercase font-bold">Proposed Amount</span>
                        <span className="text-xl font-bold text-indigo-700">{offer.amount.toLocaleString()} DZD</span>
                    </div>
                    {offer.confidence_min && (
                        <div className="flex-1 bg-amber-50 rounded p-3 border border-amber-100">
                            <span className="block text-xs text-amber-500 uppercase font-bold">Confidence Interval</span>
                            <span className="text-sm font-medium text-amber-700">
                                {offer.confidence_min.toLocaleString()} - {offer.confidence_max?.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Rationale */}
                <div className="space-y-3 mb-6">
                    {sections.map((section, idx) => (
                        <div key={idx} className="text-sm">
                            <h4 className="font-bold text-gray-700 text-xs mb-1">{section.title}</h4>
                            <p className="text-gray-600 whitespace-pre-line pl-2 border-l-2 border-gray-300">
                                {section.content}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-3 border-t border-gray-100">
                    <button
                        onClick={() => onApprove(offer.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve & Publish
                    </button>
                    <button
                        onClick={() => onReject(offer.id)}
                        className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded text-sm font-medium transition-colors"
                    >
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
};
