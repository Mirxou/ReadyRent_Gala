import { sovereignClient } from './sovereign-client';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  /** List all notifications for the current user */
  list: (params?: { limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.append('limit', params.limit.toString());
    return sovereignClient.get<Notification[]>(
      `/notifications${q.toString() ? `?${q.toString()}` : ''}`
    );
  },

  /** Alias used by dashboard/notifications */
  getAll: (params?: { limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.append('limit', params.limit.toString());
    return sovereignClient.get<Notification[]>(
      `/notifications${q.toString() ? `?${q.toString()}` : ''}`
    );
  },

  /** Get a single notification */
  get: (id: string) =>
    sovereignClient.get<Notification>(`/notifications/${id}`),

  /** Mark a notification as read (PATCH) */
  markRead: (id: string) =>
    sovereignClient.patch<void>(`/notifications/${id}`),

  /** Mark ALL notifications as read (PATCH) */
  markAllRead: () =>
    sovereignClient.patch<void>('/notifications/read-all'),

  /** Delete a notification */
  delete: (id: string) =>
    sovereignClient.delete<void>(`/notifications/${id}`),
};
