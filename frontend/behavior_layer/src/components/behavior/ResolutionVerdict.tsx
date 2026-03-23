
import { DISPUTE_PHRASES } from '@/dispute/language/dictionary';

type ResolutionType = 'VICTORY' | 'LOSS' | 'COMPROMISE';

interface ResolutionProps {
    type: ResolutionType;
}

export default function ResolutionVerdict({ type }: ResolutionProps) {
    const content = DISPUTE_PHRASES.RESOLUTION[type];

    // Visual Logic: Sovereign Colors, No Animation
    const styles = {
        VICTORY: { borderColor: '#B8860B', icon: '⚖️', bg: '#fffbf0' }, // Burnt Gold
        LOSS: { borderColor: '#708090', icon: '📖', bg: '#f8f9fa' },    // Slate Grey
        COMPROMISE: { borderColor: '#4682B4', icon: '🤝', bg: '#f0f8ff' }, // Steel Blue
    };

    const style = styles[type];

    return (
        <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            border: `2px solid ${style.borderColor}`,
            borderRadius: '8px',
            background: style.bg,
            maxWidth: '500px',
            margin: '2rem auto',
            fontFamily: 'system-ui, sans-serif'
        }}>
            {/* 1. Static Icon (No Animation) */}
            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>
                {style.icon}
            </div>

            {/* 2. Dignified Title (No "You Won") */}
            <h2 style={{
                margin: '0 0 1rem',
                color: '#333',
                fontWeight: 'bold',
                fontSize: '1.5rem'
            }}>
                {content.TITLE}
            </h2>

            {/* 3. Reasoned Description (Why, not just What) */}
            <p style={{
                color: '#555',
                fontSize: '1rem',
                marginBottom: '2.5rem',
                lineHeight: '1.6'
            }}>
                {content.DESC}
            </p>

            {/* 4. The Final Action (Close the Book) */}
            <button style={{
                padding: '0.8rem 2rem',
                background: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
            }}>
                {content.ACTION}
            </button>
        </div>
    );
}
