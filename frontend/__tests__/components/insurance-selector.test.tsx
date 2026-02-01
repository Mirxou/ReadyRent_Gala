import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InsuranceSelector } from '@/components/insurance-selector';
import { api } from '@/lib/api';

// Mock API
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockPlans = [
  {
    id: 1,
    name_ar: 'خطة تأمين',
    plan_type: 'basic',
    description_ar: 'وصف',
    max_coverage_percentage: 50,
    deductible_percentage: 10,
    calculated_price: 500,
  }
];

describe('InsuranceSelector', () => {
  it('renders plans when loaded', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockPlans });

    render(<InsuranceSelector productId={1} productValue={10000} />);

    expect(await screen.findByText('خطة تأمين')).toBeInTheDocument();
  });
});
