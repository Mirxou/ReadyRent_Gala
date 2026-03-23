
import React from 'react';

export const SovereignSeal: React.FC<{ type: string, refId: string }> = ({ type, refId }) => {
    const colors = {
        'SHIELD_SILVER': 'bg-slate-100 border-slate-400 text-slate-600',
        'BALANCE_GOLD': 'bg-amber-50 border-amber-400 text-amber-700',
        'BOOK_GREY': 'bg-gray-100 border-gray-400 text-gray-600'
    } as const;

    const theme = colors[type as keyof typeof colors] || 'bg-gray-100 border-gray-300';

    return (
        <div className={`sovereign-seal ${theme} p-4 border-2 rounded-lg flex flex-col items-center justify-center min-w-[100px]`}>
            <div className="seal-icon text-3xl mb-2">
                {type === 'BALANCE_GOLD' ? '⚖️' : type === 'SHIELD_SILVER' ? '🛡️' : '📖'}
            </div>
            <div className="ref-id text-[10px] font-mono opacity-70 tracking-wider">REF: {refId}</div>
        </div>
    );
};
