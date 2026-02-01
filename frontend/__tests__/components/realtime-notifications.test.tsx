import { render } from '@testing-library/react';
import { RealtimeNotifications } from '@/components/notifications/realtime-notifications';
import { useAuthStore, useNotificationStore } from '@/lib/store';
import { websocketClient } from '@/lib/websocket';

// Mock dependencies
jest.mock('@/lib/store', () => ({
    useAuthStore: jest.fn(),
    useNotificationStore: jest.fn(),
}));

jest.mock('@/lib/websocket', () => ({
    websocketClient: {
        connect: jest.fn(),
        disconnect: jest.fn(),
        on: jest.fn(() => jest.fn()), // Return unsubscribe function
    },
}));

jest.mock('sonner', () => ({
    toast: {
        info: jest.fn(),
    },
}));

describe('RealtimeNotifications', () => {
    it('connects to websocket when authenticated', () => {
        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            isAuthenticated: true,
            user: { id: 123 },
        });
        (useNotificationStore as unknown as jest.Mock).mockReturnValue({
            addNotification: jest.fn(),
        });

        render(<RealtimeNotifications />);

        expect(websocketClient.connect).toHaveBeenCalledWith(123);
        expect(websocketClient.on).toHaveBeenCalledWith('notification', expect.any(Function));
    });

    it('disconnects when unmounted', () => {
        const { unmount } = render(<RealtimeNotifications />);
        unmount();
        expect(websocketClient.disconnect).toHaveBeenCalled();
    });
});
