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

    // Connect WebSocket
    if (user?.id) {
      websocketClient.connect(user.id);
      connectedRef.current = true;
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
      console.log('Real-time notifications connected');
    });

    const unsubscribeDisconnected = websocketClient.on('disconnected', () => {
      console.log('Real-time notifications disconnected');
    });

    // Cleanup on unmount
    return () => {
      unsubscribeNotification();
      unsubscribeConnected();
      unsubscribeDisconnected();
      websocketClient.disconnect();
      connectedRef.current = false;
    };
  }, [isAuthenticated, user, addNotification]);

  // Disconnect when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      websocketClient.disconnect();
      connectedRef.current = false;
    }
  }, [isAuthenticated]);

  return null; // This component doesn't render anything
}

