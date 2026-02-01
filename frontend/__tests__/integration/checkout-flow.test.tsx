import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutPage from '@/app/checkout/page';
import { useAuthStore } from '@/lib/store';
import { paymentsApi, bookingsApi } from '@/lib/api';

// Mock mocks
jest.mock('@/lib/store', () => ({
    useAuthStore: jest.fn(),
}));
jest.mock('@/lib/api');
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}));

// Mock ParticleField and Framer Motion to avoid animation issues
jest.mock('@/components/ui/particle-field', () => ({
    ParticleField: () => <div data-testid="particle-field" />,
}));
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}));

// Mock React Query
const mockUseQuery = jest.fn();
const mockInvalidateQueries = jest.fn();
jest.mock('@tanstack/react-query', () => ({
    useQuery: (opts: any) => mockUseQuery(opts),
    useMutation: () => ({ mutate: jest.fn() }),
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

// Mock payment forms to simplify integration test (we test them separately)
jest.mock('@/components/payment/bank-card-form', () => ({
    BankCardForm: ({ onPaymentCompleted }: any) => (
        <div data-testid="bank-card-form">
            <button onClick={() => onPaymentCompleted()} data-testid="complete-payment-btn">
                Complete Payment
            </button>
        </div>
    ),
}));
jest.mock('@/components/payment/baridimob-form', () => ({
    BaridiMobForm: ({ onPaymentCompleted }: any) => (
        <div data-testid="baridimob-form">
            <button onClick={() => onPaymentCompleted()} data-testid="complete-baridimob-btn">
                Complete BaridiMob
            </button>
        </div>
    ),
}));

describe('Checkout Flow', () => {
    const mockRouter = { push: jest.fn() };
    const mockSearchParams = { get: jest.fn(() => '1') };

    beforeEach(() => {
        jest.clearAllMocks();
        (require('next/navigation').useRouter as jest.Mock).mockReturnValue(mockRouter);
        (require('next/navigation').useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
        (useAuthStore as unknown as jest.Mock).mockReturnValue({ isAuthenticated: true });

        // Default mocks for queries
        mockUseQuery.mockImplementation((opts: any) => {
            if (opts.queryKey[0] === 'payment-methods') {
                return {
                    data: [
                        { id: 1, name: 'bank_card', display_name: 'Bank Card' },
                        { id: 2, name: 'baridimob', display_name: 'BaridiMob' },
                    ],
                    isLoading: false,
                };
            }
            if (opts.queryKey[0] === 'booking') {
                return {
                    data: { id: 1, total_price: 5000 },
                    isLoading: false,
                };
            }
            return { data: null, isLoading: false };
        });
    });

    it('redirects if not authenticated', () => {
        (useAuthStore as unknown as jest.Mock).mockReturnValue({ isAuthenticated: false });
        render(<CheckoutPage />);
        expect(mockRouter.push).toHaveBeenCalledWith('/login?redirect=/checkout');
    });

    it('renders checkout details and payment methods', () => {
        render(<CheckoutPage />);

        expect(screen.getByText('إتمام الدفع')).toBeInTheDocument();
        expect(screen.getByText('Bank Card')).toBeInTheDocument();
        expect(screen.getByText('BaridiMob')).toBeInTheDocument();
        expect(screen.getByText(/5[\.,]000.*DZD/)).toBeInTheDocument();
    });

    it('selects payment method and shows form', () => {
        render(<CheckoutPage />);

        // Select Bank Card
        fireEvent.click(screen.getByText('Bank Card'));

        expect(screen.getByTestId('bank-card-form')).toBeInTheDocument();
        expect(screen.queryByTestId('baridimob-form')).not.toBeInTheDocument();
    });

    it('completes payment flow', async () => {
        jest.useFakeTimers();
        render(<CheckoutPage />);

        // Select Bank Card
        fireEvent.click(screen.getByText('Bank Card'));

        // Complete payment (using mock form)
        fireEvent.click(screen.getByTestId('complete-payment-btn'));

        // Check success state
        await waitFor(() => {
            expect(screen.getByText('تم الدفع بنجاح!')).toBeInTheDocument();
        });

        // Check redirection
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['bookings', 'cart'] });

        jest.runAllTimers();
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/bookings');

        jest.useRealTimers();
    });
});
