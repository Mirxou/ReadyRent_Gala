import { sovereignClient } from './sovereign-client';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
  related_object_id?: number;
  related_object_type?: string;
}

export const notificationsApi = {
  /** List all notifications for the current user */
  list: (params?: { page?: number; unread_only?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', params.page.toString());
    if (params?.unread_only) q.append('unread_only', 'true');
    return sovereignClient.get<Notification[]>(
      `/notifications/notifications/?${q.toString()}`
    );
  },

  /** Get a single notification */
  get: (id: number) =>
    sovereignClient.get<Notification>(`/notifications/notifications/${id}/`),

  /** Mark a notification as read */
  markRead: (id: number) =>
    sovereignClient.post<void>(`/notifications/notifications/${id}/mark_read/`),

  /** Mark ALL notifications as read */
  markAllRead: () =>
    sovereignClient.post<void>('/notifications/notifications/mark_all_read/'),

  /** Get unread count */
  getUnreadCount: () =>
    sovereignClient.get<{ count: number }>(
      '/notifications/notifications/unread_count/'
    ),
};
