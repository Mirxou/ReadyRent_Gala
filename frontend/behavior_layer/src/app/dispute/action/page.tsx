
import { DISPUTE_PHRASES } from '@/dispute/language/dictionary';
// In a real app, these would come from the server/engine
const MOCK_BEHAVIOR_STATE = {
    canInitiate: false, // Default to disabled (Safety First)
    status: 'REVIEWING' as keyof typeof DISPUTE_PHRASES.STATUS,
    coolingOffRemaining: 15, // Seconds
};

export default function DisputeActionPage() {
    return (
        <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
            {/* 1. Safety Message (Always First) */}
            <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', background: '#f9f9f9' }}>
                <p><strong>⚠️ {DISPUTE_PHRASES.STATUS.COOLING}</strong></p>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                    نحن نراجع المعطيات الحالية. يرجى الانتظار {MOCK_BEHAVIOR_STATE.coolingOffRemaining} ثانية.
                </p>
            </section>

            {/* 2. System Status (Read-only) */}
            <div style={{ marginBottom: '2rem' }}>
                <h3>حالة المسار</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ color: '#999' }}>⚪ {DISPUTE_PHRASES.STATUS.WAITING}</li>
                    <li style={{ fontWeight: 'bold' }}>⚫ {DISPUTE_PHRASES.STATUS.REVIEWING}</li>
                </ul>
            </div>

            {/* 3. Mutually Exclusive Input Forms */}
            <form>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                        {DISPUTE_PHRASES.INITIATION.title}
                    </label>
                    <input
                        type="text"
                        disabled
                        placeholder="المسار مغلق مؤقتاً..."
                        style={{ width: '100%', padding: '0.5rem', background: '#eee', border: '1px solid #ccc' }}
                    />
                    <small style={{ display: 'block', marginTop: '0.5rem', color: '#666' }}>
                        {DISPUTE_PHRASES.INITIATION.description}
                    </small>
                </div>

                {/* 4. Logic-controlled Button */}
                <button
                    disabled={!MOCK_BEHAVIOR_STATE.canInitiate}
                    style={{
                        padding: '1rem 2rem',
                        background: MOCK_BEHAVIOR_STATE.canInitiate ? '#000' : '#ccc',
                        color: '#fff',
                        border: 'none',
                        cursor: MOCK_BEHAVIOR_STATE.canInitiate ? 'pointer' : 'not-allowed'
                    }}
                >
                    {MOCK_BEHAVIOR_STATE.canInitiate ? "فتح مسار" : DISPUTE_PHRASES.ERRORS.TOO_FAST}
                </button>
            </form>
        </main>
    );
}
