import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BaridiMobForm } from '@/components/payment/baridimob-form';
import { toast } from 'sonner';
import { paymentsApi } from '@/lib/api';

// Mock api
jest.mock('@/lib/api', () => ({
    paymentsApi: {
        create: jest.fn(),
        verifyOtp: jest.fn(),
    },
}));

// Mock toast
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
    Smartphone: () => <span data-testid="icon-smartphone" />,
    Lock: () => <span data-testid="icon-lock" />,
}));

// Mock UI components
jest.mock('@/components/ui/input', () => ({
    Input: (props: any) => <input {...props} role="textbox" />,
}));
jest.mock('@/components/ui/label', () => ({
    Label: (props: any) => <label {...props} />,
}));

describe('BaridiMobForm', () => {
    const mockOnPaymentInitiated = jest.fn();
    const mockOnPaymentCompleted = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders phone input initially', () => {
        render(
            <BaridiMobForm
                amount={1000}
                currency="DZD"
            />
        );

        expect(screen.getByText('الدفع عبر بريدي موب')).toBeInTheDocument();
        expect(screen.getByText(/المبلغ:.*1[\.,]000.*DZD/)).toBeInTheDocument();
        expect(screen.getByLabelText('رقم الهاتف')).toBeInTheDocument();
    });

    it('validates phone input', () => {
        render(<BaridiMobForm amount={1000} />);

        // Empty submit - bypass HTML validation to test JS validation
        const submitButton = screen.getByRole('button', { name: /إرسال رمز التحقق/i });
        fireEvent.submit(submitButton.closest('form')!);
        expect(toast.error).toHaveBeenCalledWith('يرجى إدخال رقم هاتف صحيح');

        // Short phone number
        const phoneInput = screen.getByLabelText('رقم الهاتف');
        fireEvent.change(phoneInput, { target: { value: '123' } });
        fireEvent.submit(submitButton.closest('form')!);
        expect(toast.error).toHaveBeenCalledWith('يرجى إدخال رقم هاتف صحيح');
    });

    it('submits phone and switches to OTP', async () => {
        (paymentsApi.create as jest.Mock).mockResolvedValue({
            data: {
                success: true,
                payment: { id: 123 }
            }
        });

        render(
            <BaridiMobForm
                amount={1000}
                onPaymentInitiated={mockOnPaymentInitiated}
            />
        );

        const phoneInput = screen.getByLabelText('رقم الهاتف');
        fireEvent.change(phoneInput, { target: { value: '213555123456' } });

        fireEvent.click(screen.getByRole('button', { name: /إرسال رمز التحقق/i }));

        await waitFor(() => {
            expect(paymentsApi.create).toHaveBeenCalledWith(expect.objectContaining({
                payment_method: 'baridimob',
                phone_number: '213555123456'
            }));
            expect(toast.success).toHaveBeenCalledWith('تم إرسال رمز التحقق إلى هاتفك');
            expect(mockOnPaymentInitiated).toHaveBeenCalledWith(123, true);
            expect(screen.getByLabelText('رمز التحقق (OTP)')).toBeInTheDocument();
        });
    });

    it('validates OTP input', async () => {
        (paymentsApi.create as jest.Mock).mockResolvedValue({
            data: {
                success: true,
                payment: { id: 123 }
            }
        });

        render(<BaridiMobForm amount={1000} />);

        // Switch to OTP step
        fireEvent.change(screen.getByLabelText('رقم الهاتف'), { target: { value: '213555123456' } });
        fireEvent.click(screen.getByRole('button', { name: /إرسال رمز التحقق/i }));

        await waitFor(() => {
            expect(screen.getByLabelText('رمز التحقق (OTP)')).toBeInTheDocument();
        });

        // Submit valid but short OTP
        fireEvent.change(screen.getByLabelText('رمز التحقق (OTP)'), { target: { value: '123' } });
        fireEvent.click(screen.getByRole('button', { name: /تأكيد الدفع/i }));
        expect(toast.error).toHaveBeenCalledWith('يرجى إدخال رمز التحقق المكون من 6 أرقام');
    });

    it('completes payment with valid OTP', async () => {
        (paymentsApi.create as jest.Mock).mockResolvedValue({
            data: {
                success: true,
                payment: { id: 123 }
            }
        });
        (paymentsApi.verifyOtp as jest.Mock).mockResolvedValue({
            data: { success: true }
        });

        render(
            <BaridiMobForm
                amount={1000}
                onPaymentCompleted={mockOnPaymentCompleted}
            />
        );

        // Initial step
        fireEvent.change(screen.getByLabelText('رقم الهاتف'), { target: { value: '213555123456' } });
        fireEvent.click(screen.getByRole('button', { name: /إرسال رمز التحقق/i }));

        await waitFor(() => {
            expect(screen.getByLabelText('رمز التحقق (OTP)')).toBeInTheDocument();
        });

        // OTP step
        fireEvent.change(screen.getByLabelText('رمز التحقق (OTP)'), { target: { value: '123456' } });
        fireEvent.click(screen.getByRole('button', { name: /تأكيد الدفع/i }));

        await waitFor(() => {
            expect(paymentsApi.verifyOtp).toHaveBeenCalledWith(123, '123456');
            expect(toast.success).toHaveBeenCalledWith('تم الدفع بنجاح!');
            expect(mockOnPaymentCompleted).toHaveBeenCalled();
        });
    });

    it('handles verification error', async () => {
        (paymentsApi.create as jest.Mock).mockResolvedValue({
            data: {
                success: true,
                payment: { id: 123 }
            }
        });
        (paymentsApi.verifyOtp as jest.Mock).mockRejectedValue({
            response: {
                data: { error: 'Invalid OTP' }
            }
        });

        render(<BaridiMobForm amount={1000} />);

        // Initial step
        fireEvent.change(screen.getByLabelText('رقم الهاتف'), { target: { value: '213555123456' } });
        fireEvent.click(screen.getByRole('button', { name: /إرسال رمز التحقق/i }));

        await waitFor(() => {
            expect(screen.getByLabelText('رمز التحقق (OTP)')).toBeInTheDocument();
        });

        // OTP step
        fireEvent.change(screen.getByLabelText('رمز التحقق (OTP)'), { target: { value: '123456' } });
        fireEvent.click(screen.getByRole('button', { name: /تأكيد الدفع/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Invalid OTP');
        });
    });
});
