/**
 * Conversion Funnel Analytics
 * Tracks user journey from landing to booking completion
 */

export type FunnelStage = 
  | 'landing'
  | 'product_view'
  | 'cart_add'
  | 'checkout_start'
  | 'payment_initiated'
  | 'booking_completed';

export interface FunnelEvent {
  stage: FunnelStage;
  userId?: number;
  sessionId: string;
  productId?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class ConversionFunnel {
  private sessionId: string;
  private events: FunnelEvent[] = [];

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.loadEvents();
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return '';
    
    let sessionId = sessionStorage.getItem('funnel_session_id');
    if (!sessionId) {
      sessionId = `funnel_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem('funnel_session_id', sessionId);
    }
    return sessionId;
  }

  private loadEvents(): void {
    if (typeof window === 'undefined') return;
    
    const stored = sessionStorage.getItem('funnel_events');
    if (stored) {
      try {
        this.events = JSON.parse(stored).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
      } catch {
        this.events = [];
      }
    }
  }

  private saveEvents(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('funnel_events', JSON.stringify(this.events));
  }

  trackStage(stage: FunnelStage, metadata?: Record<string, any>): void {
    const event: FunnelEvent = {
      stage,
      sessionId: this.sessionId,
      timestamp: new Date(),
      metadata,
    };

    this.events.push(event);
    this.saveEvents();

    // Send to backend analytics
    this.sendToBackend(event);
  }

  private async sendToBackend(event: FunnelEvent): Promise<void> {
    try {
      const response = await fetch('/api/analytics/events/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'conversion',
          event_data: {
            stage: event.stage,
            session_id: event.sessionId,
            product_id: event.metadata?.productId,
            ...event.metadata,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Failed to send funnel event to backend:', errorText);
      }
    } catch (error) {
      // Silently fail - don't interrupt user experience
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending funnel event:', error);
      }
    }
  }

  getFunnelData(): {
    stages: Record<FunnelStage, number>;
    dropOffRates: Record<FunnelStage, number>;
    conversionRate: number;
  } {
    const stages: Record<FunnelStage, number> = {
      landing: 0,
      product_view: 0,
      cart_add: 0,
      checkout_start: 0,
      payment_initiated: 0,
      booking_completed: 0,
    };

    this.events.forEach((event) => {
      stages[event.stage] = (stages[event.stage] || 0) + 1;
    });

    const dropOffRates: Record<FunnelStage, number> = {
      landing: 0,
      product_view: 0,
      cart_add: 0,
      checkout_start: 0,
      payment_initiated: 0,
      booking_completed: 0,
    };

    // Calculate drop-off rates
    const stageOrder: FunnelStage[] = [
      'landing',
      'product_view',
      'cart_add',
      'checkout_start',
      'payment_initiated',
      'booking_completed',
    ];

    stageOrder.forEach((stage, index) => {
      if (index === 0) {
        dropOffRates[stage] = 0;
      } else {
        const previousStage = stageOrder[index - 1];
        const previousCount = stages[previousStage] || 0;
        const currentCount = stages[stage] || 0;
        dropOffRates[stage] =
          previousCount > 0
            ? ((previousCount - currentCount) / previousCount) * 100
            : 0;
      }
    });

    const conversionRate =
      stages.landing > 0
        ? (stages.booking_completed / stages.landing) * 100
        : 0;

    return {
      stages,
      dropOffRates,
      conversionRate,
    };
  }

  reset(): void {
    this.events = [];
    this.saveEvents();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('funnel_session_id');
      sessionStorage.removeItem('funnel_events');
    }
  }
}

// Singleton instance
let funnelInstance: ConversionFunnel | null = null;

export function getConversionFunnel(): ConversionFunnel {
  if (!funnelInstance) {
    funnelInstance = new ConversionFunnel();
  }
  return funnelInstance;
}

// Helper functions
export function trackLanding(): void {
  getConversionFunnel().trackStage('landing');
}

export function trackProductView(productId: number): void {
  getConversionFunnel().trackStage('product_view', { productId });
}

export function trackCartAdd(productId: number): void {
  getConversionFunnel().trackStage('cart_add', { productId });
}

export function trackCheckoutStart(): void {
  getConversionFunnel().trackStage('checkout_start');
}

export function trackPaymentInitiated(paymentId: number): void {
  getConversionFunnel().trackStage('payment_initiated', { paymentId });
}

export function trackBookingCompleted(bookingId: number): void {
  getConversionFunnel().trackStage('booking_completed', { bookingId });
}
