
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AdminReviewCard } from '../../../components/admin/AdminReviewCard';

interface PendingOffer {
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
    };
    source: 'system' | 'admin';
}

export default function AdminDashboard() {
    const [pendingOffers, setPendingOffers] = useState<PendingOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ approved: 0, rejected: 0 });

    const API_BASE_URL = 'http://127.0.0.1:8000'; // TODO: env

    const fetchPendingOffers = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/v1/admin/pending-proposals/`, {
                headers: {
                    'Authorization': `Bearer ${token || ''}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setPendingOffers(data);
            }
        } catch (error) {
            console.error('Failed to fetch pending offers', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingOffers();
    }, [fetchPendingOffers]);


    const handleDecision = async (offerId: number, action: 'approve' | 'reject') => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/v1/admin/offers/${offerId}/decide/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token || ''}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action })
            });

            if (response.ok) {
                // Remove from list
                setPendingOffers(prev => prev.filter(o => o.id !== offerId));
                setStats(prev => ({
                    ...prev,
                    [action === 'approve' ? 'approved' : 'rejected']: prev[action === 'approve' ? 'approved' : 'rejected'] + 1
                }));
            }
        } catch (error) {
            console.error(`Failed to ${action} offer`, error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <header className="mb-8 flex justify-between items-center max-w-4xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sovereign Governance</h1>
                    <p className="text-gray-500">Human supervision of AI-generated judicial proposals</p>
                </div>
                <div className="flex gap-4 text-sm">
                    <div className="bg-white px-4 py-2 rounded shadow-sm border border-gray-100">
                        <span className="block text-gray-400 text-xs uppercase font-bold text-green-600">Approved: {stats.approved}</span>
                    </div>
                    <div className="bg-white px-4 py-2 rounded shadow-sm border border-gray-100">
                        <span className="block text-gray-400 text-xs uppercase font-bold text-red-600">Rejected: {stats.rejected}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto">
                {loading ? (
                    <div className="text-center py-12 text-gray-400 animate-pulse">Scanning Neural Ledger...</div>
                ) : (
                    <div className="space-y-6">
                        {pendingOffers.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
                                <h3 className="text-lg font-medium text-gray-900">All Clear</h3>
                                <p className="text-gray-500">No pending AI proposals requiring review.</p>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                                    Pending Review ({pendingOffers.length})
                                </h2>
                                {pendingOffers.map(offer => (
                                    <AdminReviewCard
                                        key={offer.id}
                                        offer={offer} // Pass full offer object
                                        onApprove={(id) => handleDecision(id, 'approve')}
                                        onReject={(id) => handleDecision(id, 'reject')}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
