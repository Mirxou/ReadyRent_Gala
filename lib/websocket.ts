/**
 * Socket.IO client for real-time notifications
 * Connects to the notifications mini-service via Caddy gateway
 * 
 * Security: Auth is cookie-based (session_token is HttpOnly).
 * The server reads the cookie from the handshake request.
 * An explicit `authenticate` event is sent as a fallback.
 */

import { io as socketIO, Socket } from 'socket.io-client';
import { getStoredUser } from '@/lib/auth-helpers';

interface NotificationPayload {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

type EventCallback = (data: unknown) => void;

class NotificationSocketClient {
  private socket: Socket | null = null;
  private userId: string | number | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize(): void {
    if (typeof window !== 'undefined') {
      const user = getStoredUser();
      if (user?.id) {
        this.connect(user.id);
      }
    }
  }

  public connect(userId: string | number): void {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    this.isConnecting = true;
    this.userId = userId;

    try {
      // Connect via Caddy gateway using XTransformPort query parameter.
      // The session_token cookie (HttpOnly) is sent automatically by the browser.
      // The server reads it from the handshake request.
      this.socket = socketIO('/?XTransformPort=3004', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected', {});
      });

      this.socket.on('joined', (_data) => {
        // Successfully authenticated and joined user room
      });

      this.socket.on('auth_error', (_data) => {
        // Auth failed — will be disconnected by server
      });

      this.socket.on('notification', (data: NotificationPayload) => {
        this.emit('notification', data);
      });

      this.socket.on('pong', () => {
        // Connection alive
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnecting = false;
        this.emit('disconnected', { reason });
      });

      this.socket.on('connect_error', (error) => {
        this.isConnecting = false;
        this.reconnectAttempts++;
        this.emit('error', error);
      });
    } catch (error) {
      this.isConnecting = false;
      this.emit('error', error);
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.reconnectAttempts = 0;
    }
  }

  public connectFromAuth(): void {
    if (typeof window !== 'undefined') {
      const user = getStoredUser();
      if (user?.id) {
        this.connect(user.id);
      }
    }
  }

  public on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Also register on the socket if it exists
    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
      if (this.socket) {
        this.socket.off(event, callback);
      }
    };
  }

  private emit(event: string, data: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch {
          // Listener error — non-fatal
        }
      });
    }
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }
}

export const websocketClient = new NotificationSocketClient();
