import { DignifiedLoader } from '@/shared/components/sovereign/dignified-loader';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <DignifiedLoader label="جاري تجهيز المساحة السيادية..." />
        </div>
    );
}
