import { render } from '@testing-library/react';
import { Analytics } from '@/components/analytics';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Analytics', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('renders correctly with GA ID', () => {
    process.env.NEXT_PUBLIC_GA_ID = 'test-ga-id';
    const { container } = render(<Analytics />);
    expect(container).toBeInTheDocument();
  });

  it('renders correctly with FB Pixel ID', () => {
    process.env.NEXT_PUBLIC_FB_PIXEL_ID = 'test-fb-pixel-id';
    const { container } = render(<Analytics />);
    expect(container).toBeInTheDocument();
  });

  it('renders null without analytics IDs', () => {
    delete process.env.NEXT_PUBLIC_GA_ID;
    delete process.env.NEXT_PUBLIC_FB_PIXEL_ID;
    
    const { container } = render(<Analytics />);
    expect(container.firstChild).toBeNull();
  });
});
