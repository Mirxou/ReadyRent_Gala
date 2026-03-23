
import { BehavioralContext, InteractionType, InteractionResult } from '../types/behavior';

/**
 * The Sovereign Engine enforcement logic.
 * This function determines if an interaction is allowed based on the user's Merit, Risk, and Dignity context.
 */
export function enforceBehavior(
    context: BehavioralContext,
    interaction: InteractionType
): InteractionResult {
    const now = Date.now();

    // 1. Check Cooling-off (Dignity Constraint)
    if (context.dignity.isUnderCoolingOff) {
        const remainingTime = context.dignity.lastInteractionTime + (context.dignity.violationCount * 300000) - now; // 5 mins per violation
        if (remainingTime > 0) {
            return {
                allowed: false,
                reason: 'Cooling-off period active. Please wait.',
                coolingOffRequired: Math.ceil(remainingTime / 1000),
                nextAllowedInteraction: now + remainingTime
            };
        }
    }

    // 2. Risk-based Flow Control (Procedural Firmness)
    if (context.risk === 'CRITICAL' && interaction === 'ESCALATE_DISPUTE') {
        return {
            allowed: false,
            reason: 'Escalation requires further documentation verification due to risk level.',
        };
    }

    if (context.risk === 'HIGH' && interaction === 'SEND_MESSAGE') {
        // Silent throttling for high risk users (Extortionist model)
        const minInterval = 3600000; // 1 hour
        if (now - context.dignity.lastInteractionTime < minInterval) {
            return {
                allowed: false,
                reason: 'Standard review period in progress.',
                nextAllowedInteraction: context.dignity.lastInteractionTime + minInterval
            }
        }
    }

    // 3. Merit-based Privileges
    // High merit users get faster paths, but never bypass Safety checks.

    return { allowed: true };
}
