import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BundleSelector } from '@/components/bundle-selector';
import { bundlesApi } from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock API
jest.mock('@/lib/api', () => ({
  bundlesApi: {
    getAll: jest.fn(),
    calculatePrice: jest.fn(),
  },
}));

const mockBundles = [
  {
    id: 1,
    name_ar: 'باقة مميزة',
    bundle_price: 15000,
    items: [{ product: 1, item_name: 'منتج' }],
    is_featured: true,
  }
];

describe('BundleSelector', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  it('renders bundles when loaded', async () => {
    // Component expect res.data.results or res.data as array
    const response = { results: mockBundles };
    (bundlesApi.getAll as jest.Mock).mockResolvedValue({ data: response });

    render(
      <QueryClientProvider client={queryClient}>
        <BundleSelector productId={1} startDate={null} endDate={null} />
      </QueryClientProvider>
    );

    // Using findByText with regex to be more flexible
    expect(await screen.findByText(/باقة مميزة/)).toBeInTheDocument();
  });
});
