import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { languages } from './i18n';
import { authApi } from './api';

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  is_verified?: boolean;
  trust_score?: number;
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
          window.location.href = '/auth/login';
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
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// ... rest of the file (CartStore, NotificationStore, LanguageStore) ...

interface CartItem {
  id: number;
  product: { id: number; name: string; price: number };
  start_date: string;
  end_date: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  clearCart: () => set({ items: [] }),
  getTotalItems: () => get().items.length,
}));

interface Notification {
  id: number;
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
  markAsRead: (id: number) => void;
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
