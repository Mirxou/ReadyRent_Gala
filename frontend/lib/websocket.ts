/**
 * WebSocket client for real-time notifications
 */

interface NotificationMessage {
  type: 'notification' | 'pong';
  notification?: {
    id: number;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
  };
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private userId: number | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;

  constructor() {
    // Initialize WebSocket when user is authenticated
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private getWebSocketUrl(userId: number): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
    return `${protocol}//${host}/ws/notifications/${userId}/`;
  }

  private initialize(): void {
    // Try to get user ID from localStorage or auth store
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      // In a real app, you'd decode the JWT to get user ID
      // For now, we'll need to get it from the auth store or API
      this.connectFromAuth();
    }
  }

  public connect(userId: number): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.userId = userId;

    try {
      const wsUrl = this.getWebSocketUrl(userId);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startPingInterval();
        this.emit('connected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const data: NotificationMessage = JSON.parse(event.data);
          
          if (data.type === 'pong') {
            // Pong response, connection is alive
            return;
          }

          if (data.type === 'notification' && data.notification) {
            this.emit('notification', data.notification);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.stopPingInterval();
        this.emit('disconnected', {});
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
          this.reconnectAttempts++;
          setTimeout(() => {
            if (this.userId) {
              this.connect(this.userId);
            }
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      this.isConnecting = false;
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.stopPingInterval();
      this.ws.close();
      this.ws = null;
      this.userId = null;
      this.reconnectAttempts = 0;
    }
  }

  private pingInterval: NodeJS.Timeout | null = null;

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public connectFromAuth(): void {
    // This will be called when user logs in
    // We'll get user ID from auth store or API
    if (typeof window !== 'undefined') {
      // Get user ID from localStorage or API
      // For now, we'll need to manually connect after login
    }
  }

  public on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    };
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClient();

