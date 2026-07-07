'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { useNotificationStore } from '@/lib/store';
import { websocketClient } from '@/lib/websocket';
import { toast } from 'sonner';

export function RealtimeNotifications() {
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user || connectedRef.current) {
      return;
    }

    // Connect WebSocket — gracefully handle errors
    if (user?.id) {
      try {
        websocketClient.connect(Number(user.id));
        connectedRef.current = true;
      } catch {
        // WebSocket not available — silent fail, no crash
        console.warn('RealtimeNotifications: WebSocket connection failed, skipping.');
        return;
      }
    }

    // Listen for notifications
    const unsubscribeNotification = websocketClient.on('notification', (notification) => {
      addNotification(notification);
      
      // Show toast notification
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    });

    // Listen for connection events
    const unsubscribeConnected = websocketClient.on('connected', () => {
      // Real-time notifications connected
    });

    const unsubscribeDisconnected = websocketClient.on('disconnected', () => {
      // Real-time notifications disconnected
    });

    // Cleanup on unmount
    return () => {
      try {
        unsubscribeNotification();
        unsubscribeConnected();
        unsubscribeDisconnected();
        websocketClient.disconnect();
      } catch {
        // Cleanup errors are non-fatal
      }
      connectedRef.current = false;
    };
  }, [isAuthenticated, user, addNotification]);

  // Disconnect when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        websocketClient.disconnect();
      } catch {
        // non-fatal
      }
      connectedRef.current = false;
    }
  }, [isAuthenticated]);

  return null; // This component doesn't render anything
}

