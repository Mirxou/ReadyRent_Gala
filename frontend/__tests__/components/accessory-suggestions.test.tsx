import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccessorySuggestions } from '@/components/accessory-suggestions';
import { productsApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  productsApi: {
    getMatchingAccessories: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0 },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('AccessorySuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders component with productId', () => {
    (productsApi.getMatchingAccessories as jest.Mock).mockResolvedValue({
      data: { accessories: [] },
    });
    
    const wrapper = createWrapper();
    const { container } = render(<AccessorySuggestions productId={1} />, { wrapper });
    expect(container).toBeInTheDocument();
  });

  it('renders with productId and limit props', () => {
    (productsApi.getMatchingAccessories as jest.Mock).mockResolvedValue({
      data: { accessories: [] },
    });
    
    const wrapper = createWrapper();
    const { container } = render(<AccessorySuggestions productId={1} limit={5} />, { wrapper });
    expect(container).toBeInTheDocument();
  });

  it('calls API with correct parameters', async () => {
    (productsApi.getMatchingAccessories as jest.Mock).mockResolvedValue({
      data: { accessories: [] },
    });
    
    const wrapper = createWrapper();
    render(<AccessorySuggestions productId={1} limit={3} />, { wrapper });
    
    await waitFor(() => {
      expect(productsApi.getMatchingAccessories).toHaveBeenCalled();
    });
  });

  it('renders accessories when data is available', async () => {
    (productsApi.getMatchingAccessories as jest.Mock).mockResolvedValue({
      data: {
        accessories: [
          {
            id: 1,
            name_ar: 'إكسسوار تجريبي',
            slug: 'test-accessory',
            price_per_day: 1000,
            primary_image: '/test.jpg',
          },
        ],
      },
    });
    
    const wrapper = createWrapper();
    render(<AccessorySuggestions productId={1} />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByText(/إكسسوارات متوافقة/i)).toBeInTheDocument();
    });
  });
});
