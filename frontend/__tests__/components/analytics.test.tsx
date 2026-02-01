import { render } from '@testing-library/react';
import { Analytics } from '@/components/analytics';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview } from '@/lib/analytics';

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/analytics', () => ({
  pageview: jest.fn(),
}));

// Mock Next.js Script
jest.mock('next/script', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="next-script">{children}</div>,
}));

describe('Analytics', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/test-path');
    (useSearchParams as jest.Mock).mockReturnValue({ toString: () => 'param=1' });
    process.env.NEXT_PUBLIC_GA_ID = 'UA-123';
  });

  it('calls pageview on mount', () => {
    render(<Analytics />);
    expect(pageview).toHaveBeenCalledWith('/test-path?param=1');
  });
});
