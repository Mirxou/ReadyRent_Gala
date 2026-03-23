
import React from 'react';

export const JusticeReceipt: React.FC<{ stages: any[] }> = ({ stages }) => {
    return (
        <div className="justice-receipt bg-white border border-gray-200 rounded-lg p-6 shadow-sm min-w-[300px]">
            <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">مسار العملية القضائية</h3>
            <div className="space-y-3">
                {stages.map((stage, i) => (
                    <div key={i} className={`stage flex items-center gap-3 ${stage.status === 'pending' ? 'opacity-50' : ''}`}>
                        <span className="text-lg">
                            {stage.status === 'completed' && '✅'}
                            {stage.status === 'active' && '⏳'}
                            {stage.status === 'pending' && '⚪'}
                        </span>
                        <span className={`text-sm ${stage.status === 'active' ? 'font-bold text-blue-800' : 'text-gray-700'}`}>
                            {stage.label_ar}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
