import { render, screen } from '@testing-library/react';
import { ReviewList } from '@/components/reviews/review-list';

// Mock dependencies
jest.mock('@/components/reviews/rating-stars', () => ({
  RatingStars: () => <div data-testid="rating-stars" />,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, ...props }: any) => <img {...props} />,
}));

// Mock UI components
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <div data-testid="badge">{children}</div>,
}));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  CheckCircle: () => <span data-testid="icon-check-circle" />,
}));

describe('ReviewList', () => {
  const mockReviews = [
    {
      id: 1,
      user_email: 'test@example.com',
      user_username: 'Test User',
      rating: 5,
      title: 'Great',
      comment: 'Loved it',
      is_verified_purchase: true,
      helpful_count: 2,
      created_at: '2025-01-01',
      images: [{ id: 1, image: '/test.jpg', alt_text: 'Test' }],
    },
    {
      id: 2,
      user_email: 'other@example.com',
      user_username: 'Other User',
      rating: 3,
      title: 'Okay',
      comment: 'Not bad',
      is_verified_purchase: false,
      helpful_count: 0,
      created_at: '2025-01-02',
    },
  ];

  it('renders empty state', () => {
    render(<ReviewList reviews={[]} />);
    expect(screen.getByText('لا توجد تقييمات بعد')).toBeInTheDocument();
  });

  it('renders list of reviews', () => {
    render(<ReviewList reviews={mockReviews} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Great')).toBeInTheDocument();
    expect(screen.getByText('Loved it')).toBeInTheDocument();

    expect(screen.getByText('Other User')).toBeInTheDocument();
    expect(screen.getByText('Okay')).toBeInTheDocument();
  });

  it('displays verified badge correctly', () => {
    render(<ReviewList reviews={mockReviews} />);

    // First review is verified
    expect(screen.getByText('شراء موثق')).toBeInTheDocument();

    // Check icon presence
    expect(screen.getByTestId('icon-check-circle')).toBeInTheDocument();
  });

  it('displays images if present', () => {
    render(<ReviewList reviews={mockReviews} />);

    const img = screen.getByAltText('Test');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test.jpg');
  });
});
