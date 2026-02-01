import { render, screen } from '@testing-library/react';
import { QuickActions } from '@/components/admin/quick-actions';

// Mock dependencies
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}));

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
    Card: ({ children }: any) => <div data-testid="card">{children}</div>,
    CardHeader: ({ children }: any) => <div>{children}</div>,
    CardTitle: ({ children }: any) => <div>{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
    Button: ({ children }: any) => <button>{children}</button>,
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
    Plus: () => <span data-testid="icon-plus" />,
    Calendar: () => <span data-testid="icon-calendar" />,
    BarChart3: () => <span data-testid="icon-chart" />,
    Users: () => <span data-testid="icon-users" />,
    Package: () => <span data-testid="icon-package" />,
    Settings: () => <span data-testid="icon-settings" />,
    FileText: () => <span data-testid="icon-file" />,
}));

describe('QuickActions', () => {
    it('renders all action items', () => {
        render(<QuickActions />);

        expect(screen.getByText('إضافة منتج جديد')).toBeInTheDocument();
        expect(screen.getByText('الحجوزات المعلقة')).toBeInTheDocument();
        expect(screen.getByText('التقارير والتحليلات')).toBeInTheDocument();
        expect(screen.getByText('إدارة المستخدمين')).toBeInTheDocument();
        expect(screen.getByText('إدارة المنتجات')).toBeInTheDocument();
        expect(screen.getByText('الإعدادات')).toBeInTheDocument();
    });

    it('renders links with correct hrefs', () => {
        render(<QuickActions />);

        // Check key links
        expect(screen.getByText('إضافة منتج جديد').closest('a')).toHaveAttribute('href', '/admin/products/create');
        expect(screen.getByText('الحجوزات المعلقة').closest('a')).toHaveAttribute('href', '/admin/bookings?status=pending');
    });
});
