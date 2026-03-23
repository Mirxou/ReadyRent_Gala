
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { enforceBehavior } from './lib/behavior-engine';
import { BehavioralContext } from './types/behavior';

// Mock context retrieval - in real app this comes from session/db
const getMockContext = (_req: NextRequest): BehavioralContext => ({
    userId: 'mock-user',
    merit: 75,
    risk: 'MEDIUM',
    dignity: {
        violationCount: 0,
        lastInteractionTime: Date.now() - 10000,
        isUnderCoolingOff: false,
    },
});

export function middleware(request: NextRequest) {
    // Apply behavior logic only to dispute actions
    if (request.nextUrl.pathname.startsWith('/dispute/action')) {
        const context = getMockContext(request);

        // Determine interaction type from path or method (simplified)
        const interactionType = request.nextUrl.pathname.includes('escalate')
            ? 'ESCALATE_DISPUTE'
            : 'SUBMIT_EVIDENCE';

        const decision = enforceBehavior(context, interactionType);

        if (!decision.allowed) {
            // Sovereign Rejection: Return 429 (Too Many Requests) or 403 (Forbidden)
            // but with the "Dignified" reason.
            return NextResponse.json(
                {
                    error: 'Procedural Constraint',
                    message: decision.reason,
                    nextAllowed: decision.nextAllowedInteraction
                },
                { status: decision.coolingOffRequired ? 429 : 403 }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/dispute/:path*',
};
