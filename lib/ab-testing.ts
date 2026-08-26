/**
 * Simple A/B Testing Implementation
 * Allows testing different variations of features
 */

export type Variant = 'A' | 'B' | 'C';

export interface ABTest {
  name: string;
  variants: Variant[];
  weights?: number[]; // Probability weights for each variant (default: equal)
}

class ABTestingService {
  private tests: Map<string, Variant> = new Map();

  /**
   * Get or assign a variant for a test
   */
  getVariant(testName: string, variants: Variant[] = ['A', 'B'], weights?: number[]): Variant {
    // Check if variant already assigned
    if (this.tests.has(testName)) {
      return this.tests.get(testName)!;
    }

    // Assign new variant
    const variant = this.assignVariant(variants, weights);
    this.tests.set(testName, variant);

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ab_tests');
      const tests = stored ? JSON.parse(stored) : {};
      tests[testName] = variant;
      localStorage.setItem('ab_tests', JSON.stringify(tests));
    }

    return variant;
  }

  private assignVariant(variants: Variant[], weights?: number[]): Variant {
    if (!weights || weights.length !== variants.length) {
      // Equal probability
      const random = Math.random();
      const index = Math.floor(random * variants.length);
      return variants[index];
    }

    // Weighted probability
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < variants.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return variants[i];
      }
    }

    return variants[0]; // Fallback
  }

  /**
   * Track conversion for a variant
   */
  trackConversion(testName: string, variant: Variant, metadata?: Record<string, any>): void {
    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'ab_test_conversion', {
        test_name: testName,
        variant: variant,
        ...metadata,
      });
    }

    // Send to backend
    this.sendToBackend(testName, variant, metadata);
  }

  private async sendToBackend(
    testName: string,
    variant: Variant,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const response = await fetch('/api/analytics/events/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'other',
          event_data: {
            ab_test: testName,
            variant: variant,
            ...metadata,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to send A/B test data:', errorText);
        }
      }
    } catch (error) {
      // Silently fail - don't interrupt user experience
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending A/B test data:', error);
      }
    }
  }

  /**
   * Load persisted tests from localStorage
   */
  loadPersistedTests(): void {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('ab_tests');
    if (stored) {
      try {
        const tests = JSON.parse(stored);
        Object.entries(tests).forEach(([name, variant]) => {
          this.tests.set(name, variant as Variant);
        });
      } catch {
        // Invalid data, ignore
      }
    }
  }
}

// Singleton instance
let abTestingInstance: ABTestingService | null = null;

export function getABTesting(): ABTestingService {
  if (!abTestingInstance) {
    abTestingInstance = new ABTestingService();
    abTestingInstance.loadPersistedTests();
  }
  return abTestingInstance;
}

// Helper functions
export function getTestVariant(
  testName: string,
  variants: Variant[] = ['A', 'B'],
  weights?: number[]
): Variant {
  return getABTesting().getVariant(testName, variants, weights);
}

export function trackABConversion(
  testName: string,
  variant: Variant,
  metadata?: Record<string, any>
): void {
  getABTesting().trackConversion(testName, variant, metadata);
}
