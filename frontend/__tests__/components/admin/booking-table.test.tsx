import { render, screen } from '@testing-library/react';
import { BookingTable } from '@/components/admin/booking-table';

// Mock UI components
jest.mock('@/components/ui/table', () => ({
    Table: ({ children }: any) => <table>{children}</table>,
    TableHeader: ({ children }: any) => <thead>{children}</thead>,
    TableBody: ({ children }: any) => <tbody>{children}</tbody>,
    TableRow: ({ children }: any) => <tr>{children}</tr>,
    TableHead: ({ children }: any) => <th>{children}</th>,
    TableCell: ({ children }: any) => <td>{children}</td>,
}));

jest.mock('@/components/ui/badge', () => ({
    Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

// Mock BookingActions sub-component
jest.mock('@/components/admin/booking-actions', () => ({
    BookingActions: () => <button>Actions</button>,
}));

describe('BookingTable', () => {
    const mockBookings = [
        {
            id: 1,
            user: { email: 'user@example.com' },
            product: { name: 'Test Product' },
            start_date: '2025-01-01',
            end_date: '2025-01-05',
            total_days: 4,
            total_price: 4000,
            status: 'confirmed',
            created_at: '2024-12-31',
        },
        {
            id: 2,
            user: { username: 'otheruser' },
            product: null,
            start_date: '2025-02-01',
            end_date: '2025-02-02',
            total_days: 1,
            total_price: 1000,
            status: 'pending',
            created_at: '2025-01-20',
        },
    ];

    it('renders table with bookings', () => {
        render(<BookingTable bookings={mockBookings} />);

        // Check headers
        expect(screen.getByText('المستخدم')).toBeInTheDocument();
        expect(screen.getByText('المنتج')).toBeInTheDocument();

        // Check data
        expect(screen.getByText('user@example.com')).toBeInTheDocument();
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('مؤكد')).toBeInTheDocument(); // Badge content might be different localized

        expect(screen.getByText('otheruser')).toBeInTheDocument();
    });

    it('handles empty bookings', () => {
        render(<BookingTable bookings={[]} />);
        expect(screen.getByText('لا توجد حجوزات')).toBeInTheDocument();
    });

    it('renders correct status badges', () => {
        render(<BookingTable bookings={mockBookings} />);

        // Status mapping check: confirmed -> "مؤكد", pending -> "قيد الانتظار"
        expect(screen.getByText('مؤكد')).toBeInTheDocument();
        expect(screen.getByText('قيد الانتظار')).toBeInTheDocument();
    });
});
