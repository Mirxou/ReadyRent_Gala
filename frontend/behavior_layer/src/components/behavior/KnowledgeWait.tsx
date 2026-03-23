
import { DISPUTE_PHRASES } from '@/dispute/language/dictionary';

// Knowledge Waiting: Uncertainty
// Humble. Direct admission of inability to estimate.

export default function KnowledgeWait() {
    return (
        <div style={{
            padding: '1.5rem',
            textAlign: 'left', // Clinical/Direct
            borderLeft: '4px solid #999',
            background: '#f4f4f4',
            maxWidth: '450px',
            margin: '1rem auto'
        }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem', color: '#555' }}>
                ℹ️ وضع غير محدد زمنياً
            </p>
            <p style={{ margin: 0, color: '#333' }}>
                {DISPUTE_PHRASES.WAITING.KNOWLEDGE.title}.
            </p>
            <small style={{ display: 'block', marginTop: '0.5rem', color: '#777' }}>
                {DISPUTE_PHRASES.WAITING.KNOWLEDGE.desc}
            </small>
        </div>
    );
}
