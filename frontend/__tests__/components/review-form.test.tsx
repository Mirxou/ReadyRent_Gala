import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewForm } from '@/components/reviews/review-form';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/api', () => ({
  reviewsApi: {
    create: jest.fn(),
  },
}));

// Mock React Query
const mockMutate = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useMutation: (opts: any) => {
    // Intercept opts to call onSuccess/onError manually in tests if needed
    // or just return mockMutate
    // A better way is to store the options to call them later
    return {
      mutate: (data: any) => {
        mockMutate(data);
        if (data.title === 'Error') {
          opts.onError({ response: { data: { error: 'Failed' } } });
        } else {
          opts.onSuccess();
        }
      },
      isPending: false,
    };
  },
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

// Mock RatingStars
jest.mock('@/components/reviews/rating-stars', () => ({
  RatingStars: ({ onRatingChange }: any) => (
    <div data-testid="rating-stars">
      <button onClick={() => onRatingChange(5)} data-testid="rate-5">Rate 5</button>
    </div>
  ),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({ Button: (props: any) => <button {...props} /> }));
jest.mock('@/components/ui/input', () => ({ Input: (props: any) => <input {...props} /> }));
jest.mock('@/components/ui/textarea', () => ({ Textarea: (props: any) => <textarea {...props} /> }));
jest.mock('@/components/ui/label', () => ({ Label: (props: any) => <label {...props} /> }));

describe('ReviewForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form elements', () => {
    render(<ReviewForm productId={1} />);

    expect(screen.getByTestId('rating-stars')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('اكتب عنواناً للتقييم')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('شاركنا تجربتك...')).toBeInTheDocument();
    expect(screen.getByText('إضافة التقييم')).toBeInTheDocument();
  });

  it('validates empty inputs', () => {
    render(<ReviewForm productId={1} />);

    fireEvent.click(screen.getByText('إضافة التقييم'));

    expect(toast.error).toHaveBeenCalledWith('يرجى ملء جميع الحقول');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits valid review', async () => {
    render(<ReviewForm productId={1} bookingId={100} />);

    // Fill inputs
    fireEvent.change(screen.getByPlaceholderText('اكتب عنواناً للتقييم'), { target: { value: 'Great Product' } });
    fireEvent.change(screen.getByPlaceholderText('شاركنا تجربتك...'), { target: { value: 'Really loved it.' } });

    // Submit
    fireEvent.click(screen.getByText('إضافة التقييم'));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        product_id: 1,
        booking_id: 100,
        rating: 5, // Default
        title: 'Great Product',
        comment: 'Really loved it.',
      });
      expect(toast.success).toHaveBeenCalledWith('تم إضافة التقييم بنجاح');
    });
  });

  it('handles submission error', () => {
    render(<ReviewForm productId={1} />);

    // Trigger error logic via mockTitle 'Error' (see mock above)
    fireEvent.change(screen.getByPlaceholderText('اكتب عنواناً للتقييم'), { target: { value: 'Error' } });
    fireEvent.change(screen.getByPlaceholderText('شاركنا تجربتك...'), { target: { value: 'Comment' } });

    fireEvent.click(screen.getByText('إضافة التقييم'));

    expect(toast.error).toHaveBeenCalledWith('Failed');
  });
});
