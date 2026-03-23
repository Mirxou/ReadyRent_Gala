
import { DISPUTE_PHRASES } from '@/dispute/language/dictionary';

// Mock State for Merit/Risk Engine
const MOCK_ENGINE_STATE = {
    allowFreeText: false, // HARD DIGNITY: Deny free text to prevent emotional dumping
    requiredEvidenceCount: 2,
    uploadedCount: 0,
};

export default function EvidencePage() {
    return (
        <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto' }}>

            {/* 1. Header: Directive Language */}
            <h2 style={{ marginBottom: '0.5rem' }}>{DISPUTE_PHRASES.EVIDENCE.TITLE}</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
                {DISPUTE_PHRASES.EVIDENCE.INSTRUCTION}
            </p>

            {/* 2. Constrained Input (The Silencer) */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px dashed #999', background: '#f5f5f5', textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
                    📎 {DISPUTE_PHRASES.EVIDENCE.UPLOAD_BTN}
                </p>
                <input type="file" style={{ display: 'none' }} />
                <button style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #ccc' }}>
                    اختيار ملف
                </button>
                <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: '#999' }}>
                    {MOCK_ENGINE_STATE.uploadedCount} / {MOCK_ENGINE_STATE.requiredEvidenceCount} ملفات مطلوبة
                </p>
            </div>

            {/* 3. The "No Text" Message (Friction) */}
            {!MOCK_ENGINE_STATE.allowFreeText && (
                <div style={{ padding: '1rem', background: '#fff3cd', border: '1px solid #ffeeba', color: '#856404', fontSize: '0.9rem' }}>
                    🚫 {DISPUTE_PHRASES.EVIDENCE.NO_TEXT}
                </div>
            )}

            {/* 4. Action Button (Gatekeeper) */}
            <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                <button
                    disabled={MOCK_ENGINE_STATE.uploadedCount < MOCK_ENGINE_STATE.requiredEvidenceCount}
                    style={{
                        padding: '1rem 2rem',
                        background: '#ccc', // Visual indicator of "Not Ready"
                        color: '#fff',
                        border: 'none',
                        cursor: 'not-allowed'
                    }}
                >
                    {DISPUTE_PHRASES.STATUS.WAITING}
                </button>
            </div>

        </main>
    );
}
