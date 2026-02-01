import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DamageInspection } from '@/components/damage-inspection';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

// Mock lucide-react icons to avoid nesting issues
jest.mock('lucide-react', () => ({
  Upload: () => <span data-testid="icon-upload" />,
  Camera: () => <span data-testid="icon-camera" />,
  CheckCircle2: () => <span data-testid="icon-check" />,
  XCircle: () => <span data-testid="icon-x" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
}));

// Mock UI components to avoid Radix UI issues in JSDOM
jest.mock('@/components/ui/button', () => ({
  Button: ({ asChild, ...props }: any) => <button {...props} />,
}));
jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} role="textbox" />,
}));
jest.mock('@/components/ui/label', () => ({
  Label: (props: any) => <label {...props} />,
}));
jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: any) => <div data-testid="select-wrapper">{children}</div>,
  SelectTrigger: ({ children }: any) => <button role="combobox">{children}</button>,
  SelectValue: () => <span>Select Value</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, onSelect, value }: any) => (
    <div onClick={() => onSelect && onSelect(value)} role="option">
      {children}
    </div>
  ),
}));

describe('DamageInspection', () => {
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  const mockAssessment = {
    id: 1,
    booking: 123,
    severity: 'minor',
    status: 'pending',
    damage_description: 'Scratch on door',
    repair_cost: 500,
    replacement_cost: 0,
    notes: 'Visible scratch',
    photos: [],
  };

  it('renders and loads existing assessment', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [mockAssessment] });

    render(<DamageInspection bookingId={123} />);

    await waitFor(() => {
      // For textarea/input, getByDisplayValue is fine
      expect(screen.getByDisplayValue('Scratch on door')).toBeInTheDocument();
      expect(screen.getByDisplayValue('500')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Visible scratch')).toBeInTheDocument();
    });
  });

  it('handles creating new assessment', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    (api.post as jest.Mock).mockResolvedValue({ data: mockAssessment });

    render(<DamageInspection bookingId={123} />);

    // Fill form
    fireEvent.change(screen.getByLabelText('وصف الضرر'), { target: { value: 'New Damage' } });
    fireEvent.change(screen.getByLabelText('تكلفة الإصلاح (دج)'), { target: { value: '1000' } });

    // Since Select is mocked roughly, let's verify visual rendering mainly or use a simpler test for functionality if needed.
    // Ideally we simulate selecting severity. But with the current mock it's complex.
    // Let's assume defaults or just test other inputs.

    // Submit
    const submitBtn = screen.getByRole('button', { name: /إنشاء التقييم/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Expect default severity 'none'
      expect(api.post).toHaveBeenCalledWith('/bookings/damage-assessment/', expect.objectContaining({
        booking_id: 123,
        damage_description: 'New Damage',
        repair_cost: 1000,
        severity: 'none',
      }));
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'تم إنشاء التقييم',
      }));
    });
  });

  it('handles updating existing assessment', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [mockAssessment] });
    (api.patch as jest.Mock).mockResolvedValue({ data: { ...mockAssessment, repair_cost: 600 } });

    render(<DamageInspection bookingId={123} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Scratch on door')).toBeInTheDocument();
    });

    // Update cost
    fireEvent.change(screen.getByLabelText('تكلفة الإصلاح (دج)'), { target: { value: '600' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /تحديث التقييم/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(`/bookings/damage-assessment/1/`, expect.objectContaining({
        repair_cost: 600,
      }));
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'تم التحديث',
      }));
    });
  });
});
