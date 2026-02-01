import { render, screen, waitFor } from '@testing-library/react';
import { AccessorySuggestions } from '@/components/accessory-suggestions';
import { productsApi } from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock API
jest.mock('@/lib/api', () => ({
  productsApi: {
    getMatchingAccessories: jest.fn(),
  },
}));

// Mock ProductCard (to simplify)
jest.mock('@/components/product-card', () => ({
  ProductCard: ({ product }: any) => <div data-testid="product-card">{product.name_ar}</div>,
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const mockData = {
  accessories: [
    { id: 101, name_ar: 'حقيبة يد', price_per_day: 1000, compatibility: 'perfect' },
    { id: 102, name_ar: 'حذاء كعب عالي', price_per_day: 2000, compatibility: 'good' },
  ],
  primary_product_color: '#FF0000'
};

describe('AccessorySuggestions', () => {
  it('renders nothing when no accessories', async () => {
    (productsApi.getMatchingAccessories as jest.Mock).mockResolvedValue({ data: { accessories: [] } });

    render(
      <QueryClientProvider client={queryClient}>
        <AccessorySuggestions productId={1} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('إكسسوارات متوافقة')).not.toBeInTheDocument();
    });
  });

  it('renders suggestions when available', async () => {
    (productsApi.getMatchingAccessories as jest.Mock).mockResolvedValue({ data: mockData });

    render(
      <QueryClientProvider client={queryClient}>
        <AccessorySuggestions productId={1} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('إكسسوارات متوافقة مع هذا المنتج')).toBeInTheDocument();
      expect(screen.getByText('حقيبة يد')).toBeInTheDocument();
      expect(screen.getByText('حذاء كعب عالي')).toBeInTheDocument();
    });
  });
});
