"use client";

/**
 * WebSocket Hooks
 *
 * Provides React hooks for WebSocket connections with:
 * - Automatic reconnection with exponential backoff
 * - Heartbeat/ping-pong for connection health
 * - Channel-based subscriptions
 * - Type-safe event handling
 *
 * NOTE: In production, these hooks automatically use Pusher instead of WebSocket
 * when NEXT_PUBLIC_PUSHER_KEY is configured. This provides more reliable
 * real-time updates without maintaining a custom WebSocket server.
 *
 * @module hooks/use-websocket
 *
 * @example
 * // Basic WebSocket connection
 * const { isConnected, lastMessage, send } = useWebSocket({
 *   url: "ws://localhost:3001/ws",
 *   channels: ["orders", "kitchen"],
 * });
 *
 * @example
 * // Subscribe to specific events
 * useWSEvent(lastMessage, {
 *   eventType: "order.created",
 *   onEvent: (event) => console.log("New order:", event.payload),
 * });
 *
 * @example Response
 * {
 *   state: "connected",
 *   isConnected: true,
 *   lastMessage: {
 *     type: "order.created",
 *     payload: { orderId: "123", tableNumber: 5 },
 *     sequence: 42,
 *     timestamp: "2024-01-15T10:30:00Z"
 *   },
 *   lastEventSequence: 42
 * }
 */

import * as React from "react";
import type {
  WSEvent,
  WSEventType,
  WS_EVENTS,
  SubscriptionChannel,
  SubscriptionRequest,
} from "@/lib/websocket-events";

// Re-export Pusher hooks as the default implementation for production
// These provide the same interface but use Pusher instead of raw WebSocket
export {
  useTableEvents,
  useStationEvents,
  useStorageEvents,
} from "./use-pusher";

/** WebSocket connection state */
type ConnectionState = "connecting" | "connected" | "disconnected" | "reconnecting";

interface UseWebSocketOptions {
  url: string;
  token?: string;
  channels?: SubscriptionChannel[];
  reconnectAttempts?: number;
  reconnectDelayMs?: number;
  heartbeatIntervalMs?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onReconnect?: (attempt: number) => void;
}

interface UseWebSocketReturn {
  state: ConnectionState;
  isConnected: boolean;
  lastMessage: WSEvent | null;
  lastEventSequence: number;
  subscribe: (channels: SubscriptionChannel[]) => void;
  unsubscribe: (channels: SubscriptionChannel[]) => void;
  send: <T>(data: T) => void;
  reconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    token,
    channels = [],
    reconnectAttempts = 5,
    reconnectDelayMs = 1000,
    heartbeatIntervalMs = 30000,
    onConnect,
    onDisconnect,
    onError,
    onReconnect,
  } = options;

  const wsRef = React.useRef<WebSocket | null>(null);
  const reconnectCountRef = React.useRef(0);
  const heartbeatRef = React.useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = React.useState<ConnectionState>("disconnected");
  const [lastMessage, setLastMessage] = React.useState<WSEvent | null>(null);
  const [lastEventSequence, setLastEventSequence] = React.useState(0);
  const [subscribedChannels, setSubscribedChannels] = React.useState<Set<SubscriptionChannel>>(
    new Set(channels)
  );

  // Connect to WebSocket
  const connect = React.useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setState("connecting");

    const wsUrl = token ? `${url}?token=${token}` : url;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setState("connected");
      reconnectCountRef.current = 0;

      // Subscribe to initial channels
      if (subscribedChannels.size > 0) {
        const subscribeMsg: SubscriptionRequest = {
          action: "subscribe",
          channels: Array.from(subscribedChannels),
        };
        ws.send(JSON.stringify(subscribeMsg));
      }

      // Start heartbeat
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, heartbeatIntervalMs);

      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSEvent;

        // Skip pong messages
        if ((data as unknown as { type: string }).type === "pong") return;

        setLastMessage(data);
        if (data.sequence) {
          setLastEventSequence(data.sequence);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = (error) => {
      onError?.(error);
    };

    ws.onclose = () => {
      setState("disconnected");

      // Clear heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }

      onDisconnect?.();

      // Attempt reconnect with exponential backoff
      if (reconnectCountRef.current < reconnectAttempts) {
        setState("reconnecting");
        reconnectCountRef.current += 1;
        onReconnect?.(reconnectCountRef.current);

        // Exponential backoff: delay * 2^attempt with jitter
        const exponentialDelay = reconnectDelayMs * Math.pow(2, reconnectCountRef.current - 1);
        const jitter = Math.random() * 0.3 * exponentialDelay;
        const delay = Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };

    wsRef.current = ws;
  }, [
    url,
    token,
    subscribedChannels,
    reconnectAttempts,
    reconnectDelayMs,
    heartbeatIntervalMs,
    onConnect,
    onDisconnect,
    onError,
    onReconnect,
  ]);

  // Disconnect
  const disconnect = React.useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState("disconnected");
  }, []);

  // Subscribe to channels
  const subscribe = React.useCallback((newChannels: SubscriptionChannel[]) => {
    setSubscribedChannels((prev) => {
      const updated = new Set(prev);
      newChannels.forEach((ch) => updated.add(ch));
      return updated;
    });

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const msg: SubscriptionRequest = {
        action: "subscribe",
        channels: newChannels,
      };
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Unsubscribe from channels
  const unsubscribe = React.useCallback((channelsToRemove: SubscriptionChannel[]) => {
    setSubscribedChannels((prev) => {
      const updated = new Set(prev);
      channelsToRemove.forEach((ch) => updated.delete(ch));
      return updated;
    });

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const msg: SubscriptionRequest = {
        action: "unsubscribe",
        channels: channelsToRemove,
      };
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Send message
  const send = React.useCallback(<T,>(data: T) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  // Manual reconnect
  const reconnect = React.useCallback(() => {
    disconnect();
    reconnectCountRef.current = 0;
    connect();
  }, [connect, disconnect]);

  // Connect on mount
  React.useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    state,
    isConnected: state === "connected",
    lastMessage,
    lastEventSequence,
    subscribe,
    unsubscribe,
    send,
    reconnect,
  };
}

/**
 * WebSocket Event Hook Options
 */
interface UseWSEventOptions<T extends WSEventType> {
  eventType: T;
  onEvent: (event: WSEvent<T>) => void;
}

/**
 * Hook for subscribing to specific WebSocket event types
 *
 * @param lastMessage - Last received WebSocket message
 * @param options - Event subscription options
 *
 * @example
 * useWSEvent(lastMessage, {
 *   eventType: "order.created",
 *   onEvent: (event) => {
 *     console.log("New order:", event.payload.orderId);
 *   },
 * });
 */
export function useWSEvent<T extends WSEventType>(
  lastMessage: WSEvent | null,
  options: UseWSEventOptions<T>
): void {
  const { eventType, onEvent } = options;

  React.useEffect(() => {
    if (lastMessage && lastMessage.type === eventType) {
      onEvent(lastMessage as WSEvent<T>);
    }
  }, [lastMessage, eventType, onEvent]);
}

// Table, Station, and Storage event hooks are now re-exported from use-pusher.ts
// See the export statement at the top of this file
