import { render, screen } from '@testing-library/react';
import { CancellationPolicy } from '@/components/cancellation-policy';

describe('CancellationPolicy', () => {
  const mockFeeInfo = {
    fee_percentage: 10,
    fee_amount: 500,
    refund_amount: 4500,
    hours_until_start: 20,
  };

  it('renders correctly when cancellation is allowed', () => {
    render(
      <CancellationPolicy
        feeInfo={mockFeeInfo}
        canCancel={true}
        message="يمكنك الإلغاء"
      />
    );

    expect(screen.getByText('سياسة الإلغاء')).toBeInTheDocument();
    expect(screen.getByText(/20 ساعة/)).toBeInTheDocument(); // Time until start
    expect(screen.getByText('10%')).toBeInTheDocument(); // Fee percentage
    expect(screen.getByText('500.00 دج')).toBeInTheDocument(); // Fee amount
    expect(screen.getByText('4500.00 دج')).toBeInTheDocument(); // Refund amount
  });

  it('displays accurate time formatting for days', () => {
    const feeInfoDays = { ...mockFeeInfo, hours_until_start: 48 };
    render(
      <CancellationPolicy
        feeInfo={feeInfoDays}
        canCancel={true}
        message=""
      />
    );
    expect(screen.getByText(/2 يوم/)).toBeInTheDocument();
  });

  it('renders warning message when cancellation is not allowed', () => {
    render(
      <CancellationPolicy
        feeInfo={mockFeeInfo}
        canCancel={false}
        message="لا يمكنك الإلغاء في الوقت الحالي"
      />
    );

    expect(screen.getByText('لا يمكنك الإلغاء في الوقت الحالي')).toBeInTheDocument();
    expect(screen.queryByText('المبلغ المسترجع')).not.toBeInTheDocument();
  });
});
