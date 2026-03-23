
import { DisputeInitiation } from '../../../../flows/sovereign/DisputeInitiation';
import '../../../../styles/modes.css';

export default function InitiateDisputePage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <DisputeInitiation />
        </main>
    );
}
