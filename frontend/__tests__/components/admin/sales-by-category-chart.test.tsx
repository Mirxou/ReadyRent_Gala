import { render, screen } from '@testing-library/react';
import { SalesByCategoryChart } from '@/components/admin/sales-by-category-chart';

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

describe('SalesByCategoryChart', () => {
    const mockData = [
        {
            product__category__name_ar: 'إلكترونيات',
            product__category__name: 'Electronics',
            count: 10,
            revenue: 50000,
            avg_price: 5000,
        },
        {
            product__category__name_ar: null,
            product__category__name: 'Furniture',
            count: 5,
            revenue: 20000,
            avg_price: 4000,
        },
    ];

    it('renders chart title', () => {
        render(<SalesByCategoryChart data={mockData} />);
        expect(screen.getByText('المبيعات حسب الفئة')).toBeInTheDocument();
    });

    it('renders chart components', () => {
        render(<SalesByCategoryChart data={mockData} />);
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
});
