
import { setup, assign } from 'xstate';

export type DisputeContext = {
    evidenceCount: number;
    lastActionTime: number;
    coolingOffEndsAt?: number;
};

export type DisputeEvent =
    | { type: 'SUBMIT_EVIDENCE' }
    | { type: 'REQUEST_ESCALATION' }
    | { type: 'COOLING_OFF_COMPLETE' };

export const disputeMachine = setup({
    types: {
        context: {} as DisputeContext,
        events: {} as DisputeEvent,
    },
    actions: {
        incrementEvidence: assign({
            evidenceCount: ({ context }) => context.evidenceCount + 1,
            lastActionTime: () => Date.now(),
        }),
        setCoolingOff: assign({
            coolingOffEndsAt: () => Date.now() + 300000, // 5 mins
            lastActionTime: () => Date.now(),
        }),
    },
}).createMachine({
    id: 'disputeFlow',
    initial: 'collectingEvidence',
    context: {
        evidenceCount: 0,
        lastActionTime: Date.now(),
    },
    states: {
        collectingEvidence: {
            on: {
                SUBMIT_EVIDENCE: {
                    actions: 'incrementEvidence',
                    // Self-transition to stay in collecting, but logic will handle limits
                },
                REQUEST_ESCALATION: [
                    {
                        target: 'coolingOff',
                        guard: ({ context }) => context.evidenceCount < 2, // Friction: Need >2 pieces of evidence 
                    },
                    {
                        target: 'negotiation',
                    }
                ]
            }
        },
        coolingOff: {
            entry: 'setCoolingOff',
            on: {
                COOLING_OFF_COMPLETE: 'collectingEvidence' // Return to collecting, not straight to negotiation
            }
        },
        negotiation: {
            type: 'final' // Placeholder
        },
    },
});
