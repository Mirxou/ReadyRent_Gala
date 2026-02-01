import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BankCardForm } from '@/components/payment/bank-card-form';
import { toast } from 'sonner';
import { paymentsApi } from '@/lib/api';

// Mock api
jest.mock('@/lib/api', () => ({
    paymentsApi: {
        create: jest.fn(),
    },
}));

// Mock toast
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
    },
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
    CreditCard: () => <span data-testid="icon-credit-card" />,
    Lock: () => <span data-testid="icon-lock" />,
    Shield: () => <span data-testid="icon-shield" />,
}));

// Mock UI components
jest.mock('@/components/ui/input', () => ({
    Input: (props: any) => <input {...props} role="textbox" />,
}));
jest.mock('@/components/ui/label', () => ({
    Label: (props: any) => <label {...props} />,
}));

describe('BankCardForm', () => {
    const mockOnPaymentInitiated = jest.fn();
    const mockOnPaymentCompleted = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders payment form with amount', () => {
        render(
            <BankCardForm
                amount={1000}
                currency="DZD"
            />
        );

        expect(screen.getByText('الدفع بالبطاقة البنكية')).toBeInTheDocument();
        expect(screen.getByText(/المبلغ:.*1[\.,]000.*DZD/)).toBeInTheDocument();
        expect(screen.getByLabelText('رقم البطاقة')).toBeInTheDocument();
        expect(screen.getByLabelText('تاريخ الانتهاء')).toBeInTheDocument();
        expect(screen.getByLabelText('CVV')).toBeInTheDocument();
        expect(screen.getByLabelText('اسم حامل البطاقة')).toBeInTheDocument();
    });

    it('validates form inputs', async () => {
        render(<BankCardForm amount={1000} />);

        const submitButton = screen.getByRole('button', { name: /تأكيد الدفع/i });

        // Empty submit
        // Empty submit - bypass HTML validation to test JS validation
        fireEvent.submit(submitButton.closest('form')!);
        expect(toast.error).toHaveBeenCalledWith('يرجى إدخال رقم بطاقة صحيح');

        // Invalid card number
        const cardInput = screen.getByLabelText('رقم البطاقة');
        fireEvent.change(cardInput, { target: { value: '123' } });
        fireEvent.submit(submitButton.closest('form')!);
        expect(toast.error).toHaveBeenCalledWith('يرجى إدخال رقم بطاقة صحيح');
    });

    it('submits valid form data', async () => {
        (paymentsApi.create as jest.Mock).mockResolvedValue({
            data: {
                success: true,
                payment: { id: 123 }
            }
        });

        render(
            <BankCardForm
                amount={1000}
                bookingId={1}
                onPaymentInitiated={mockOnPaymentInitiated}
                onPaymentCompleted={mockOnPaymentCompleted}
            />
        );

        // Fill form
        fireEvent.change(screen.getByLabelText('رقم البطاقة'), { target: { value: '4242424242424242' } });
        fireEvent.change(screen.getByLabelText('تاريخ الانتهاء'), { target: { value: '1225' } });
        fireEvent.change(screen.getByLabelText('CVV'), { target: { value: '123' } });
        fireEvent.change(screen.getByLabelText('اسم حامل البطاقة'), { target: { value: 'JOHN DOE' } });

        // Submit
        fireEvent.click(screen.getByRole('button', { name: /تأكيد الدفع/i }));

        await waitFor(() => {
            expect(paymentsApi.create).toHaveBeenCalledWith({
                payment_method: 'bank_card',
                amount: 1000,
                currency: 'DZD',
                booking_id: 1,
                card_number: '4242424242424242',
                card_expiry: '12/25',
                card_cvv: '123',
                cardholder_name: 'JOHN DOE'
            });
            expect(toast.success).toHaveBeenCalled();
            expect(mockOnPaymentInitiated).toHaveBeenCalledWith(123, false);
            expect(mockOnPaymentCompleted).toHaveBeenCalled();
        });
    });

    it('handles 3D secure redirect', async () => {
        (paymentsApi.create as jest.Mock).mockResolvedValue({
            data: {
                success: true,
                requires_3d_secure: true,
                redirect_url: 'https://secure.bank.com',
                payment: { id: 123 }
            }
        });

        render(
            <BankCardForm
                amount={1000}
                onPaymentInitiated={mockOnPaymentInitiated}
            />
        );

        // Fill valid data
        fireEvent.change(screen.getByLabelText('رقم البطاقة'), { target: { value: '4242424242424242' } });
        fireEvent.change(screen.getByLabelText('تاريخ الانتهاء'), { target: { value: '1225' } });
        fireEvent.change(screen.getByLabelText('CVV'), { target: { value: '123' } });
        fireEvent.change(screen.getByLabelText('اسم حامل البطاقة'), { target: { value: 'JOHN DOE' } });

        fireEvent.click(screen.getByRole('button', { name: /تأكيد الدفع/i }));

        await waitFor(() => {
            expect(toast.info).toHaveBeenCalled();
            // Verify callback received redirect URL - actual navigation is tested via the callback
            expect(mockOnPaymentInitiated).toHaveBeenCalledWith(123, true, 'https://secure.bank.com');
        });
    });

    it('handles submission error', async () => {
        (paymentsApi.create as jest.Mock).mockRejectedValue({
            response: {
                data: { error: 'Card declined' }
            }
        });

        render(<BankCardForm amount={1000} />);

        // Fill valid data
        fireEvent.change(screen.getByLabelText('رقم البطاقة'), { target: { value: '4242424242424242' } });
        fireEvent.change(screen.getByLabelText('تاريخ الانتهاء'), { target: { value: '1225' } });
        fireEvent.change(screen.getByLabelText('CVV'), { target: { value: '123' } });
        fireEvent.change(screen.getByLabelText('اسم حامل البطاقة'), { target: { value: 'JOHN DOE' } });

        fireEvent.click(screen.getByRole('button', { name: /تأكيد الدفع/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Card declined');
        });
    });
});
