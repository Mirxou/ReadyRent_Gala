import { render, screen, fireEvent } from '@testing-library/react';
import { BranchSelector } from '@/components/branch-selector';
import { api } from '@/lib/api';

// Mock API
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockBranches = [
  {
    id: 1,
    name_ar: 'فرع أساسي',
    address: 'وسط المدينة',
    city: 'قسنطينة',
    phone: '031000000',
    is_active: true,
    product_count: 50,
    staff_count: 5,
  }
];

describe('BranchSelector', () => {
  it('renders branches when loaded', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockBranches });

    render(<BranchSelector />);

    // Check for loading first
    expect(screen.getByText(/تحميل/)).toBeInTheDocument();

    // Then wait for data
    expect(await screen.findByText('فرع أساسي')).toBeInTheDocument();
  });
});
