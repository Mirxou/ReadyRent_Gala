
import ResolutionVerdict from '@/components/behavior/ResolutionVerdict';

export default function ResolutionGalleryPage() {
    return (
        <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '3rem' }}>لغة النهايات (Resolution Language)</h1>

            <section style={{ marginBottom: '4rem' }}>
                <h3 style={{ textAlign: 'center', color: '#666', marginBottom: '1rem' }}>1. استعادة الحق (Victory without Arrogance)</h3>
                <ResolutionVerdict type="VICTORY" />
            </section>

            <section style={{ marginBottom: '4rem' }}>
                <h3 style={{ textAlign: 'center', color: '#666', marginBottom: '1rem' }}>2. تصحيح المسار (Loss without Humiliation)</h3>
                <ResolutionVerdict type="LOSS" />
            </section>

            <section style={{ marginBottom: '4rem' }}>
                <h3 style={{ textAlign: 'center', color: '#666', marginBottom: '1rem' }}>3. التوافق المرضي (Dignified Compromise)</h3>
                <ResolutionVerdict type="COMPROMISE" />
            </section>

        </main>
    );
}
