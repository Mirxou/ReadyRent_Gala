'use client';
import React, { useState } from 'react';
import { api } from '@/lib/api';
import { AgreementWidget } from './contracts/AgreementWidget';
import { useAuthStore } from '@/lib/store';

interface AgreementRecorderProps {
    bookingId: number;
}

export const AgreementRecorder = ({ bookingId }: AgreementRecorderProps) => {
    const { user } = useAuthStore();
    const [isRecording, setIsRecording] = useState(false);
    const [textNote, setTextNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Store the full agreement object after creation
    const [agreement, setAgreement] = useState<any>(null);

    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const audioChunksRef = React.useRef<Blob[]>([]);

    const handleStartRecord = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("لا يمكن الوصول للميكروفون. تأكد من الصلاحيات.");
        }
    };

    const handleStopRecord = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (!audioBlob && !textNote) {
                alert("يرجى تسجيل الاتفاق صوتياً أو كتابياً أولاً.");
                setIsSubmitting(false);
                return;
            }

            const formData = new FormData();
            formData.append('booking_id', bookingId.toString());
            if (audioBlob) {
                formData.append('audio', audioBlob, 'agreement.webm');
            }
            // Note: If we supported text-only, we'd append textNote here too, 
            // but current backend focuses on audio. For MVP, we'll assume audio is primary
            // or textNote is just for UI context.

            const res = await api.post('/contracts/generate/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log('Agreement Created:', res.data);
            setAgreement(res.data);
            setTextNote('');

        } catch (err) {
            console.error('Error sending agreement', err);
            alert("حدث خطأ أثناء إرسال العقد. حاول مرة أخرى.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // If agreement exists (either just created or passed in props if we expanded this), show Widget
    if (agreement) {
        return (
            <AgreementWidget
                agreement={agreement}
                currentUserId={user?.id || 0}
                onAgreementUpdated={(updated) => setAgreement(updated)}
            />
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-lg mx-auto">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#2c3e50] font-['IBM_Plex_Sans_Arabic']">تأكيد العقد الشفهي</h2>
                <span className="text-xs text-gray-500 font-['IBM_Plex_Sans_Arabic']">
                    لتعزيز الثقة وحل النزاعات
                </span>
            </div>

            <div className="space-y-6">

                {/* 1. Voice Logic */}
                <div className="flex flex-col items-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all ${isRecording
                        ? 'bg-red-100 border-red-500 animate-pulse'
                        : 'bg-gray-100 border-gray-300'
                        }`}>
                        <svg className={`w-8 h-8 ${isRecording ? 'text-red-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>

                    <button
                        onClick={isRecording ? handleStopRecord : handleStartRecord}
                        disabled={isSubmitting}
                        className={`px-6 py-2 rounded-md font-bold transition-colors shadow-sm ${isRecording
                            ? 'bg-red-600 hover:bg-red-700 text-white border-red-700'
                            : 'bg-[#2c3e50] hover:bg-[#34495e] text-white'
                            }`}
                    >
                        {isRecording ? 'إيقاف التسجيل' : 'تسجيل ملاحظة صوتية'}
                    </button>

                    {isRecording && <p className="text-xs text-red-500 animate-pulse">جاري الاستماع...</p>}
                </div>

                <div className="border-t border-gray-100"></div>

                {/* 2. Text Logic (Visual Only for now as backend emphasizes Audio) */}
                <div>
                    <label className="block text-sm font-medium text-[#2c3e50] mb-2 font-['IBM_Plex_Sans_Arabic']">
                        أو كتابة تعهد شفهي
                    </label>
                    <textarea
                        value={textNote}
                        onChange={(e) => setTextNote(e.target.value)}
                        disabled={isSubmitting}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-right"
                        dir="rtl"
                        placeholder="مثال: أتعهد بأنني سأعيد الفستان نظيفاً (سيتم دمجه مع الصوت)..."
                    />
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || (!textNote && !isRecording)}
                    className={`w-full py-3 px-4 rounded-md text-white font-bold transition-colors font-['IBM_Plex_Sans_Arabic'] ${isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[#d4af37] hover:bg-[#b9463a]'
                        }`}
                >
                    {isSubmitting ? 'جاري معالجة العقد...' : 'تثبيت العقد'}
                </button>
            </div>
        </div>
    );
};

