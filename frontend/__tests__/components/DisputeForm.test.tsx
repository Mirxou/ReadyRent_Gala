import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisputeForm } from '@/components/dispute-form';

// Mock API
jest.mock('@/lib/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

describe('DisputeForm', () => {
  const mockBooking = {
    id: 1,
    product: {
      name_ar: 'فستان تجريبي',
    },
  };

  it('renders form fields', () => {
    render(<DisputeForm bookingId={1} onSuccess={() => {}} />);
    
    expect(screen.getByLabelText(/عنوان/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/الوصف/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<DisputeForm bookingId={1} onSuccess={() => {}} />);
    
    const submitButton = screen.getByRole('button', { name: /إرسال/i });
    await user.click(submitButton);
    
    // Form validation should prevent submission
    await waitFor(() => {
      expect(screen.getByText(/مطلوب/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    const { api } = require('@/lib/api');
    
    api.post.mockResolvedValue({ data: { id: 1 } });
    
    render(<DisputeForm bookingId={1} onSuccess={onSuccess} />);
    
    await user.type(screen.getByLabelText(/عنوان/i), 'Test Dispute');
    await user.type(screen.getByLabelText(/الوصف/i), 'Test description');
    
    const submitButton = screen.getByRole('button', { name: /إرسال/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/disputes/disputes/create/', expect.any(Object));
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});

