
import ProtectiveWait from '@/components/behavior/ProtectiveWait';
import JudgmentWait from '@/components/behavior/JudgmentWait';
import KnowledgeWait from '@/components/behavior/KnowledgeWait';

export default function WaitingGalleryPage() {
    return (
        <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '3rem' }}>معرض أخلاقيات الانتظار (Silent Interfaces)</h1>

            <section style={{ marginBottom: '4rem' }}>
                <h3 style={{ textAlign: 'center', color: '#666', marginBottom: '1rem' }}>1. الانتظار الحمائي (Protective)</h3>
                <ProtectiveWait minutesRemaining={5} />
            </section>

            <section style={{ marginBottom: '4rem' }}>
                <h3 style={{ textAlign: 'center', color: '#666', marginBottom: '1rem' }}>2. الانتظار الحكمي (Judgment)</h3>
                <JudgmentWait />
            </section>

            <section style={{ marginBottom: '4rem' }}>
                <h3 style={{ textAlign: 'center', color: '#666', marginBottom: '1rem' }}>3. الانتظار المعرفي (Knowledge)</h3>
                <KnowledgeWait />
            </section>

        </main>
    );
}
