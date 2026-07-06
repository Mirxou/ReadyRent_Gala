import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { languages } from './i18n';
import { authApi } from './api';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  is_verified?: boolean;
  trust_score?: number;
  wallet_balance?: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User | null) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },
      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout failed', error);
        }
        set({
          user: null,
          isAuthenticated: false,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('session-token');
          window.location.href = '/login';
        }
      },
      checkAuth: async () => {
        try {
          const { data } = await authApi.me();
          set({ user: data, isAuthenticated: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        }
      }
    }),
    {
      name: 'auth-storage-v2', // Version bumped to invalidate old token storage
      partialize: (state) => ({
        user: state.user ? {
          id: state.user.id,
          username: state.user.username,
          role: state.user.role,
          is_verified: state.user.is_verified,
        } : null,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.is_read ? 0 : 1),
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
  getUnreadCount: () => get().unreadCount,
}));

interface LanguageState {
  language: 'ar' | 'fr' | 'en';
  setLanguage: (lang: 'ar' | 'fr' | 'en') => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => {
      const getInitialLanguage = (): 'ar' | 'fr' | 'en' => {
        if (typeof window === 'undefined') return 'ar';
        const stored = localStorage.getItem('language');
        return (stored === 'ar' || stored === 'fr' || stored === 'en') ? stored : 'ar';
      };

      const initialLang = getInitialLanguage();
      const initialDir = initialLang === 'ar' ? 'rtl' : 'ltr';

      // Initialize document attributes
      if (typeof window !== 'undefined') {
        document.documentElement.lang = initialLang;
        document.documentElement.dir = initialDir;
      }

      return {
        language: initialLang,
        setLanguage: (lang) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('language', lang);
            const langConfig = languages.find((l) => l.code === lang);
            document.documentElement.lang = lang;
            document.documentElement.dir = langConfig?.dir || (lang === 'ar' ? 'rtl' : 'ltr');
          }
          set({ language: lang });
        },
      };
    },
    {
      name: 'language-storage',
    }
  )
);
