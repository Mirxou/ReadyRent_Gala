import { render, screen } from '@testing-library/react';
import { TopProductsChart } from '@/components/admin/top-products-chart';

// Mock Recharts
jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
}));

describe('TopProductsChart', () => {
    const mockData = [
        {
            product__id: 1,
            product__name_ar: 'كاميرا',
            product__name: 'Camera',
            count: 20,
            revenue: 100000,
            avg_price: 5000,
        },
        {
            product__id: 2,
            product__name_ar: null,
            product__name: 'Lens',
            count: 15,
            revenue: 50000,
            avg_price: 3333,
        },
    ];

    it('renders chart title', () => {
        render(<TopProductsChart data={mockData} limit={5} />);
        expect(screen.getByText('أفضل 5 منتج')).toBeInTheDocument();
    });

    it('renders chart components', () => {
        render(<TopProductsChart data={mockData} />);
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
});
