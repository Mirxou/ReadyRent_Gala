/**
 * Push Notifications Service for PWA
 * Handles registration and sending of push notifications
 */

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  /**
   * Register service worker for push notifications
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      return this.registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      return null;
    }

    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
      }

      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ) as any,
      });

      // Send subscription to backend
      await this.sendSubscriptionToBackend(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return false;
    }

    try {
      const result = await this.subscription.unsubscribe();
      if (result) {
        this.subscription = null;
        // Notify backend
        await this.removeSubscriptionFromBackend();
      }
      return result;
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      return false;
    }
  }

  /**
   * Send local notification
   */
  async showNotification(payload: PushNotificationPayload): Promise<void> {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      // Fallback to browser notification
      if (Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon,
          badge: payload.badge,
          image: payload.image,
          data: payload.data,
          tag: payload.tag,
          requireInteraction: payload.requireInteraction,
        } as any);
      }
      return;
    }

    await this.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
      image: payload.image,
      data: payload.data,
      tag: payload.tag,
      requireInteraction: payload.requireInteraction,
      actions: payload.actions,
    } as any);
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToBackend(
    subscription: PushSubscription
  ): Promise<void> {
    try {
      const response = await fetch('/api/notifications/push/subscribe/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to send subscription to backend:', errorText);
        }
      }
    } catch (error) {
      // Silently fail - don't interrupt user experience
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending subscription:', error);
      }
    }
  }

  private async removeSubscriptionFromBackend(): Promise<void> {
    try {
      const response = await fetch('/api/notifications/push/unsubscribe/', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to remove subscription from backend:', errorText);
        }
      }
    } catch (error) {
      // Silently fail - don't interrupt user experience
      if (process.env.NODE_ENV === 'development') {
        console.error('Error removing subscription:', error);
      }
    }
  }
}

// Singleton instance
let pushServiceInstance: PushNotificationService | null = null;

export function getPushNotificationService(): PushNotificationService {
  if (!pushServiceInstance) {
    pushServiceInstance = new PushNotificationService();
  }
  return pushServiceInstance;
}

// Helper functions
export async function enablePushNotifications(): Promise<boolean> {
  const service = getPushNotificationService();
  const subscription = await service.subscribe();
  return subscription !== null;
}

export async function disablePushNotifications(): Promise<boolean> {
  const service = getPushNotificationService();
  return await service.unsubscribe();
}

export async function showNotification(payload: PushNotificationPayload): Promise<void> {
  const service = getPushNotificationService();
  await service.showNotification(payload);
}
