import { sovereignClient } from './sovereign-client';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
  related_object_id?: string;
  related_object_type?: string;
}

export const notificationsApi = {
  /** List all notifications for the current user */
  list: (params?: { page?: number; unread_only?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', params.page.toString());
    if (params?.unread_only) q.append('unread_only', 'true');
    return sovereignClient.get<Notification[]>(
      `/notifications/?${q.toString()}`
    );
  },

  /** Alias used by dashboard/notifications */
  getAll: (params?: { page?: number; unread_only?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', params.page.toString());
    if (params?.unread_only) q.append('unread_only', 'true');
    return sovereignClient.get<Notification[]>(
      `/notifications/?${q.toString()}`
    );
  },

  /** Get a single notification */
  get: (id: string) =>
    sovereignClient.get<Notification>(`/notifications/${id}/`),

  /** Mark a notification as read */
  markRead: (id: string) =>
    sovereignClient.post<void>(`/notifications/${id}/`),

  /** Mark ALL notifications as read */
  markAllRead: () =>
    sovereignClient.post<void>('/notifications/read-all/'),

  // TODO: route not yet implemented — /notifications/unread-count
  /** Get unread count */
  getUnreadCount: () =>
    sovereignClient.get<{ count: number }>('/notifications/'),
};
