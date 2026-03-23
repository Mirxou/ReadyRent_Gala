
import { DISPUTE_PHRASES } from '@/dispute/language/dictionary';

// Protective Waiting: Cooling-off
// No spinner. Calm, static message. Optional approximate time.

export default function ProtectiveWait({ minutesRemaining }: { minutesRemaining?: number }) {
    return (
        <div style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            background: '#fafafa',
            maxWidth: '400px',
            margin: '1rem auto'
        }}>
            <h3 style={{ margin: '0 0 1rem', color: '#333' }}>
                ☕ {DISPUTE_PHRASES.WAITING.PROTECTIVE.title}
            </h3>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>
                {DISPUTE_PHRASES.WAITING.PROTECTIVE.desc}
            </p>
            {minutesRemaining && (
                <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#888' }}>
                    الوقت المقدر: ≈ {minutesRemaining} دقائق
                </p>
            )}
        </div>
    );
}
