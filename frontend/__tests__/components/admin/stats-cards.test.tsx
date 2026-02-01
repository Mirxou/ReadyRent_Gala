import { render, screen } from '@testing-library/react';
import { StatsCards } from '@/components/admin/stats-cards';

// Mock UI components
jest.mock('@/components/ui/card', () => ({
    Card: ({ children }: any) => <div data-testid="card">{children}</div>,
    CardHeader: ({ children }: any) => <div>{children}</div>,
    CardTitle: ({ children }: any) => <div>{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
    Users: () => <span data-testid="icon-users" />,
    Package: () => <span data-testid="icon-package" />,
    Calendar: () => <span data-testid="icon-calendar" />,
    DollarSign: () => <span data-testid="icon-dollar" />,
    TrendingUp: () => <span data-testid="icon-up" />,
    TrendingDown: () => <span data-testid="icon-down" />,
}));

describe('StatsCards', () => {
    const mockStats = {
        overall: {
            users: 100,
            products: 50,
            bookings: 25,
            revenue: 50000,
        },
        this_month: {
            users: 10,
            bookings: 5,
            revenue: 10000,
        },
        products: {
            active: 45,
            rented: 5,
        },
        pending_actions: {
            bookings: 3,
        },
    };

    it('renders all stat cards with metrics', () => {
        render(<StatsCards stats={mockStats} />);

        expect(screen.getByText('إجمالي المستخدمين')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('+10 هذا الشهر')).toBeInTheDocument();

        expect(screen.getByText('إجمالي المنتجات')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('45 نشط')).toBeInTheDocument();

        expect(screen.getByText('إجمالي الحجوزات')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('3 قيد الانتظار')).toBeInTheDocument();

        expect(screen.getByText('إجمالي الإيرادات')).toBeInTheDocument();
        expect(screen.getByText('50000 دج')).toBeInTheDocument();
        expect(screen.getByText('10000 دج هذا الشهر')).toBeInTheDocument();
    });

    it('handles zero or missing stats gracefully', () => {
        render(<StatsCards stats={{}} />);

        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThan(0);

        // Check specific fallbacks
        expect(screen.getByText('0 دج')).toBeInTheDocument();
    });
});
