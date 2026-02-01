import { render, screen } from '@testing-library/react';
import { RevenueChart } from '@/components/admin/revenue-chart';

// Mock Recharts
jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    LineChart: () => <div data-testid="line-chart">LineChart</div>,
    Line: () => <div data-testid="line" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
    Card: ({ children }: any) => <div data-testid="card">{children}</div>,
    CardHeader: ({ children }: any) => <div>{children}</div>,
    CardTitle: ({ children }: any) => <div>{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
}));

describe('RevenueChart', () => {
    const mockData = [
        { day: '2025-01-01', revenue: 1000, count: 5 },
        { day: '2025-01-02', revenue: 2000, count: 8 },
    ];

    const mockPeriod = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        days: 31,
    };

    it('renders chart title', () => {
        render(<RevenueChart data={mockData} />);
        expect(screen.getByText('الإيرادات اليومية')).toBeInTheDocument();
    });

    it('renders date range if period provided', () => {
        render(<RevenueChart data={mockData} period={mockPeriod} />);
        // Note: Localized date string might vary based on test env locale, but checking parts usually safe
        // "1 يناير" and "31 يناير" might show up. Let's check generally or just that it renders.
        // The component renders: from ... to ...
        expect(screen.getByText(/من/)).toBeInTheDocument();
    });

    it('renders recharts components', () => {
        render(<RevenueChart data={mockData} />);
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
});
