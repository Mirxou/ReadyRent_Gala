import { render, screen, waitFor } from '@testing-library/react';
import { BranchSelector } from '@/components/branch-selector';
import { api } from '@/lib/api';

jest.mock('@/lib/api');

describe('BranchSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        results: [
          {
            id: 1,
            name_ar: 'فرع تجريبي',
            address: '123 Test Street',
            city: 'Constantine',
            phone: '+213123456789',
            email: 'test@example.com',
            is_active: true,
            product_count: 10,
            staff_count: 5,
            opening_hours: {},
          },
        ],
      },
    });

    render(<BranchSelector />);
    await waitFor(() => {
      expect(screen.getByText(/اختر الفرع/i)).toBeInTheDocument();
    });
  });

  it('handles branch selection', async () => {
    const onSelect = jest.fn();
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        results: [
          {
            id: 1,
            name_ar: 'فرع تجريبي',
            address: '123 Test Street',
            city: 'Constantine',
            phone: '+213123456789',
            email: 'test@example.com',
            is_active: true,
            product_count: 10,
            staff_count: 5,
            opening_hours: {},
          },
        ],
      },
    });

    render(<BranchSelector onSelect={onSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText(/فرع تجريبي/i)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<BranchSelector />);
    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });
});
