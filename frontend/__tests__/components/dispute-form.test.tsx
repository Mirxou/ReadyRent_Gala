import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DisputeForm } from '@/components/dispute-form';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

describe('DisputeForm', () => {
  const mockToast = jest.fn();
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  it('renders form correctly', () => {
    render(<DisputeForm bookingId={123} />);

    expect(screen.getByText('إنشاء نزاع')).toBeInTheDocument();
    expect(screen.getByLabelText('العنوان')).toBeInTheDocument();
    expect(screen.getByLabelText('الوصف')).toBeInTheDocument();
    expect(screen.getByText('الأولوية')).toBeInTheDocument();
  });

  it('validates empty submission', () => {
    render(<DisputeForm />);

    const submitButton = screen.getByRole('button', { name: /إرسال النزاع/i });
    fireEvent.click(submitButton);

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'destructive',
      title: 'خطأ',
    }));
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits valid form successfully', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

    render(<DisputeForm bookingId={123} onComplete={mockOnComplete} />);

    // Fill form
    fireEvent.change(screen.getByLabelText('العنوان'), { target: { value: 'Test Dispute' } });
    fireEvent.change(screen.getByLabelText('الوصف'), { target: { value: 'Test Description' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /إرسال النزاع/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/disputes/disputes/create/', {
        title: 'Test Dispute',
        description: 'Test Description',
        priority: 'medium',
        booking_id: 123,
      });
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'تم الإرسال',
      }));
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('handles submission error', async () => {
    (api.post as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Server Error' } }
    });

    render(<DisputeForm bookingId={123} />);

    // Fill form
    fireEvent.change(screen.getByLabelText('العنوان'), { target: { value: 'Test Dispute' } });
    fireEvent.change(screen.getByLabelText('الوصف'), { target: { value: 'Test Description' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /إرسال النزاع/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'destructive',
        description: 'Server Error',
      }));
    });
  });
});
