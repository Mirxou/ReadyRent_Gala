import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductDetailPage from '@/app/products/[id]/page';
import { bookingsApi, productsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'dress-slug' }),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('@/lib/store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  productsApi: {
    getBySlug: jest.fn(),
    getById: jest.fn(),
  },
  bookingsApi: {
    addToCart: jest.fn(),
  },
  reviewsApi: {
    getAll: jest.fn(() => Promise.resolve({ data: [] })),
  },
  hygieneApi: {
    getLatestForProduct: jest.fn(() => Promise.resolve({ data: {} })),
  },
  warrantiesApi: {
    getPlans: jest.fn(() => Promise.resolve({ data: [] })),
  },
}));

jest.mock('@/lib/analytics', () => ({
  trackProductView: jest.fn(),
  trackAddToCart: jest.fn(),
}));

// Mock UI components that cause issues or complexity
jest.mock('@/components/ui/particle-field', () => ({ ParticleField: () => <div /> }));
jest.mock('@/components/ui/tilt-card', () => ({ TiltCard: ({ children }: any) => <div>{children}</div> }));
// Mock BookingCalendar to control date selection
jest.mock('@/components/booking-calendar', () => ({
  BookingCalendar: ({ onDateSelect }: any) => (
    <div data-testid="booking-calendar">
      <button
        data-testid="select-dates-btn"
        onClick={() => {
          const start = new Date('2025-05-01');
          const end = new Date('2025-05-03');
          onDateSelect(start, end);
        }}
      >
        Select Dates
      </button>
    </div>
  ),
}));

// Mock MagneticButton to ensure clickability without animation issues
jest.mock('@/components/ui/magnetic-button', () => ({
  MagneticButton: ({ children, onClick, disabled, variant }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={variant === 'outline' ? 'book-now-btn' : 'add-to-cart-btn'}
    >
      {children}
    </button>
  )
}));

// Mock Lightbox (yet-another-react-lightbox)
jest.mock('yet-another-react-lightbox', () => () => <div />);
jest.mock('yet-another-react-lightbox/plugins/zoom', () => ({}));
jest.mock('yet-another-react-lightbox/plugins/counter', () => ({}));
jest.mock('yet-another-react-lightbox/plugins/thumbnails', () => ({}));
jest.mock('yet-another-react-lightbox/styles.css', () => ({}));
jest.mock('yet-another-react-lightbox/plugins/thumbnails.css', () => ({}));

// Mock other sub-components
jest.mock('@/components/bundle-selector', () => ({ BundleSelector: () => <div data-testid="bundle-selector" /> }));
jest.mock('@/components/accessory-suggestions', () => ({ AccessorySuggestions: () => <div data-testid="accessory-suggestions" /> }));
jest.mock('@/components/product-recommendations', () => ({ ProductRecommendations: () => <div data-testid="product-recommendations" /> }));
jest.mock('@/components/share-button', () => ({ ShareButton: () => <div data-testid="share-button" /> }));
jest.mock('@/components/reviews/review-list', () => ({ ReviewList: () => <div data-testid="review-list" /> }));
jest.mock('@/components/reviews/review-form', () => ({ ReviewForm: () => <div data-testid="review-form" /> }));
jest.mock('@/components/reviews/rating-stars', () => ({ RatingStars: () => <div data-testid="rating-stars" /> }));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: (opts: any) => {
    if (opts.queryKey[0] === 'product') {
      // Return product data
      return {
        data: {
          id: 1,
          name_ar: 'فستان سهرة فاخر',
          price_per_day: 5000,
          status: 'available',
          images: [{ image: '/img.jpg', is_primary: true }],
          category: { name_ar: 'فساتين' }
        },
        isLoading: false
      };
    }
    // Return empty/null for others
    return { data: null, isLoading: false };
  },
  useMutation: (opts: any) => ({
    mutate: (data: any) => {
      // Simulate success
      bookingsApi.addToCart(data);
      opts.onSuccess();
    },
    isPending: false
  }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

describe('Booking Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ isAuthenticated: true });
  });

  it('completes full booking flow: view product, select dates, add to cart', async () => {
    render(<ProductDetailPage />);

    // 1. Verify product loaded
    expect(screen.getByText('فستان سهرة فاخر')).toBeInTheDocument();

    // 2. Verify "Add to Cart" is initially disabled or prompts for dates
    // 2. Verify "Add to Cart" is showing prompt text
    const addToCartBtn = screen.getByTestId('add-to-cart-btn');
    expect(screen.getByText('حددوا تواريخ التألق')).toBeInTheDocument();

    expect(addToCartBtn).not.toBeDisabled();

    // 3. Select dates via mocked calendar
    fireEvent.click(screen.getByTestId('select-dates-btn'));

    // 4. Verify "Add to Cart" becomes enabled
    expect(addToCartBtn).not.toBeDisabled();
    expect(screen.getByText('أضف إلى السلة')).toBeInTheDocument();

    // 5. Click "Add to Cart"
    fireEvent.click(addToCartBtn);

    // 6. Verify API call
    await waitFor(() => {
      expect(bookingsApi.addToCart).toHaveBeenCalledWith(expect.objectContaining({
        product_id: 1,
        start_date: '2025-05-01',
        end_date: '2025-05-03',
      }));
    });
  });
});
