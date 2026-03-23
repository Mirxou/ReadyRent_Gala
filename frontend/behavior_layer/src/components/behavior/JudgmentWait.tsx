
import { DISPUTE_PHRASES } from '@/dispute/language/dictionary';

// Judgment Waiting: Deliberation
// No motion. No time estimate. Just heavy, respectful silence.

export default function JudgmentWait() {
    return (
        <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '2px solid #333', // Thicker border for weight
            background: '#fff',
            maxWidth: '500px',
            margin: '1rem auto'
        }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚖️</div>
            <h2 style={{ margin: '0 0 1rem', color: '#000', fontWeight: 'bold' }}>
                {DISPUTE_PHRASES.WAITING.JUDGMENT.title}
            </h2>
            <p style={{ color: '#444', fontSize: '1rem' }}>
                {DISPUTE_PHRASES.WAITING.JUDGMENT.desc}
            </p>
        </div>
    );
}
