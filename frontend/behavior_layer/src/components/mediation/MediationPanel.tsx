
import React, { useEffect, useState } from 'react';
import { OfferCard } from './OfferCard';
import { SovereignSeal } from '../sovereign/SovereignSeal';

interface MediationPanelProps {
    disputeId: number;
    onComplete: () => void;
}

export const MediationPanel: React.FC<MediationPanelProps> = ({ disputeId, onComplete }) => {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = 'http://127.0.0.1:8000'; // TODO: Move to env

    useEffect(() => {
        fetchSession();
    }, [disputeId]);

    const fetchSession = async () => {
        try {
            // First try to fetch existing session
            let response = await fetch(`${API_BASE_URL}/api/v1/judicial/${disputeId}/mediation/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`, // Assuming token auth
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 404) {
                // If no session, start one
                response = await fetch(`${API_BASE_URL}/api/v1/judicial/${disputeId}/mediation/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ action: 'start' })
                });
            }

            const data = await response.json();
            setSession(data);
        } catch (e) {
            console.error("Failed to load mediation", e);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (offerId: number) => {
        try {
            const token = localStorage.getItem('token') || '';
            const response = await fetch(`${API_BASE_URL}/api/v1/judicial/${disputeId}/mediation/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'reject_offer',
                    offer_id: offerId
                })
            });

            if (response.ok) {
                // Refresh session to show next round or close
                fetchSession();
                if (onComplete) onComplete();
            }
        } catch (error) {
            console.error('Error rejecting offer:', error);
        }
    };

    const handleAccept = async (offerId: number) => {
        try {
            await fetch(`${API_BASE_URL}/api/v1/judicial/${disputeId}/mediation/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'accept_offer', offer_id: offerId })
            });
            onComplete();
        } catch (e) {
            console.error("Failed to accept offer", e);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">جاري تحليل البيانات لبناء نموذج التسوية...</div>;

    if (!session) return null;

    return (
        <div className="max-w-3xl mx-auto p-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">الوساطة السيادية</h2>
                    <p className="text-gray-500 text-sm">محاولة حل النزاع ودياً بناءً على سوابق قضائية مماثلة</p>
                </div>
                <SovereignSeal type="BALANCE" refId={`MED-${session.id}`} />
            </div>

            <div className="space-y-6">
                {session.offers?.map((offer: any) => (
                    <OfferCard
                        key={offer.id}
                        offer={offer}
                        onAccept={handleAccept}
                        onReject={() => handleReject(offer.id)}
                    />
                ))}
            </div>

            <div className="mt-8 text-center">
                <p className="text-xs text-gray-400">
                    هذا العرض صالح حتى {new Date(session.expires_at).toLocaleDateString()}
                </p>
            </div>
        </div>
    );
};
