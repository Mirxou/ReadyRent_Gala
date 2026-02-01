import { render, screen } from '@testing-library/react';
import { ForecastChart } from '@/components/forecast-chart';

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <span data-testid="icon-trending-up" />,
  TrendingDown: () => <span data-testid="icon-trending-down" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

describe('ForecastChart', () => {
  const mockForecast = {
    predicted_demand: 150,
    predicted_revenue: 75000.50,
    confidence_level: 85.5,
    seasonal_factor: 1.2,
    trend_factor: 1.15,
  };

  it('renders forecast data correctly', () => {
    render(<ForecastChart forecast={mockForecast} productName="Test Product" />);

    expect(screen.getByText('التنبؤ بالطلب')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();

    expect(screen.getByText('150')).toBeInTheDocument(); // Demand
    expect(screen.getByText('75000.50 دج')).toBeInTheDocument(); // Revenue

    expect(screen.getByText('85.5%')).toBeInTheDocument(); // Confidence
    expect(screen.getByText('1.20x')).toBeInTheDocument(); // Seasonal
    expect(screen.getByText('1.15x')).toBeInTheDocument(); // Trend
  });

  it('displays correct trend icons', () => {
    render(<ForecastChart forecast={mockForecast} />);
    // High trend > 1.1 should show TrendingUp
    expect(screen.getAllByTestId('icon-trending-up').length).toBeGreaterThan(0);
  });
});
