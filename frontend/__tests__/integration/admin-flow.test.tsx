import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboardPage from '@/app/admin/dashboard/page';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

jest.mock('@/lib/store', () => ({
    useAuthStore: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
    adminApi: {
        getDashboardStats: jest.fn(),
        getRevenue: jest.fn(),
    },
}));

// Mock UI components
jest.mock('@/components/ui/particle-field', () => ({ ParticleField: () => <div /> }));
jest.mock('@/components/ui/tilt-card', () => ({ TiltCard: ({ children }: any) => <div>{children}</div> }));
jest.mock('@/components/admin/stats-cards', () => ({ StatsCards: () => <div data-testid="stats-cards" /> }));
jest.mock('@/components/admin/revenue-chart', () => ({ RevenueChart: () => <div data-testid="revenue-chart" /> }));
jest.mock('@/components/admin/quick-actions', () => ({ QuickActions: () => <div data-testid="quick-actions" /> }));
jest.mock('@/components/ui/magnetic-button', () => ({ MagneticButton: ({ children }: any) => <button>{children}</button> }));
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
    useQuery: (opts: any) => {
        if (opts.queryKey[0] === 'admin-dashboard-stats') {
            return {
                data: {
                    overall: { products: 10, bookings: 5, users: 20 },
                    products: { active: 8, rented: 2 },
                    pending_actions: { bookings: 1 },
                    this_month: { users: 5 },
                    top_products: [{ id: 1, name: 'Dress', bookings: 3 }]
                },
                isLoading: false
            };
        }
        if (opts.queryKey[0] === 'admin-revenue') {
            return {
                data: {
                    daily_revenue: [{ day: '2023-01-01', revenue: 100 }],
                    period: {}
                },
                isLoading: false
            };
        }
        return { data: null, isLoading: false };
    },
}));

describe('Admin Flow Integration', () => {
    const mockRouter = { push: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
        (require('next/navigation').useRouter as jest.Mock).mockReturnValue(mockRouter);
    });

    it('redirects if not authenticated', () => {
        (useAuthStore as unknown as jest.Mock).mockReturnValue({ isAuthenticated: false, user: null });
        render(<AdminDashboardPage />);
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });

    it('redirects if user is not admin or staff', () => {
        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            isAuthenticated: true,
            user: { role: 'customer' }
        });
        render(<AdminDashboardPage />);
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });

    it('renders dashboard for admin', async () => {
        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            isAuthenticated: true,
            user: { role: 'admin' }
        });

        render(<AdminDashboardPage />);

        // Verify main sections are present
        expect(screen.getByText('نظرة عامة')).toBeInTheDocument();
        expect(screen.getByText('إدارة قسنطينة')).toBeInTheDocument();

        // Verify mocked components
        expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
        expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
        expect(screen.getByTestId('quick-actions')).toBeInTheDocument();

        // Verify stats content (propagated via props/context or direct render)
        // Note: Since we mocked StatsCards, we can't test its content here, 
        // but we can test the surrounding layout elements like "المنتجات", "الحجوزات" cards
        expect(screen.getByText('المنتجات')).toBeInTheDocument();
        expect(screen.getByText('الحجوزات')).toBeInTheDocument();
        expect(screen.getByText('المستخدمون')).toBeInTheDocument();
    });
});
