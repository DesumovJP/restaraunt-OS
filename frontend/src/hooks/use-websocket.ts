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

// Import Pusher hooks for production use
import {
  isPusherEnabled,
  useTableEvents as usePusherTableEvents,
  useStationEvents as usePusherStationEvents,
  useStorageEvents as usePusherStorageEvents,
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

/**
 * Table Events Hook
 *
 * Subscribes to WebSocket events for a specific table.
 * Handles order creation, item status changes, timers, and SLA warnings.
 *
 * @param tableNumber - Table number to subscribe to
 * @param options - Event callbacks
 * @returns Connection status
 *
 * @example
 * const { isConnected } = useTableEvents(5, {
 *   onOrderCreated: (event) => refetchOrders(),
 *   onItemStatusChanged: (event) => updateItem(event.payload),
 *   onSLAWarning: (event) => showWarning(event.payload),
 * });
 */
export function useTableEvents(
  tableNumber: number,
  options: {
    onOrderCreated?: (event: WSEvent) => void;
    onItemStatusChanged?: (event: WSEvent) => void;
    onTimerSync?: (event: WSEvent) => void;
    onSLAWarning?: (event: WSEvent) => void;
  }
) {
  // Use Pusher in production when configured
  if (isPusherEnabled()) {
    return usePusherTableEvents(tableNumber, options);
  }

  const wsOptions = React.useMemo(
    () => ({
      url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws",
      channels: [`tables:${tableNumber}` as SubscriptionChannel, "timers" as SubscriptionChannel],
    }),
    [tableNumber]
  );

  const { lastMessage, isConnected, state } = useWebSocket(wsOptions);

  React.useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case "order.created":
        options.onOrderCreated?.(lastMessage);
        break;
      case "item.status_changed":
        options.onItemStatusChanged?.(lastMessage);
        break;
      case "timer.sync":
        options.onTimerSync?.(lastMessage);
        break;
      case "timer.sla_warning":
      case "timer.sla_breach":
        options.onSLAWarning?.(lastMessage);
        break;
    }
  }, [lastMessage, options]);

  return { isConnected, state };
}

/**
 * Station Events Hook
 *
 * Subscribes to WebSocket events for a specific kitchen station.
 * Handles task lifecycle and load monitoring.
 *
 * @param stationType - Station type (e.g., "grill", "fry", "salad")
 * @param options - Event callbacks
 * @returns Connection status
 *
 * @example
 * const { isConnected } = useStationEvents("grill", {
 *   onTaskCreated: (event) => addTask(event.payload),
 *   onLoadChanged: (event) => updateLoad(event.payload),
 *   onOverloadWarning: (event) => alertChef(event.payload),
 * });
 */
export function useStationEvents(
  stationType: string,
  options: {
    onTaskCreated?: (event: WSEvent) => void;
    onTaskStarted?: (event: WSEvent) => void;
    onTaskCompleted?: (event: WSEvent) => void;
    onLoadChanged?: (event: WSEvent) => void;
    onOverloadWarning?: (event: WSEvent) => void;
  }
) {
  // Use Pusher in production when configured
  if (isPusherEnabled()) {
    return usePusherStationEvents(stationType, options);
  }

  const wsOptions = React.useMemo(
    () => ({
      url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws",
      channels: [`stations:${stationType}` as SubscriptionChannel],
    }),
    [stationType]
  );

  const { lastMessage, isConnected, state } = useWebSocket(wsOptions);

  React.useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case "station.task_created":
        options.onTaskCreated?.(lastMessage);
        break;
      case "station.task_started":
        options.onTaskStarted?.(lastMessage);
        break;
      case "station.task_completed":
        options.onTaskCompleted?.(lastMessage);
        break;
      case "station.load_changed":
        options.onLoadChanged?.(lastMessage);
        break;
      case "station.overload_warning":
        options.onOverloadWarning?.(lastMessage);
        break;
    }
  }, [lastMessage, options]);

  return { isConnected, state };
}

/**
 * Storage Events Hook
 *
 * Subscribes to WebSocket events for storage/inventory updates.
 * Handles batch operations, stock alerts, and yield variance.
 *
 * @param productDocumentId - Optional product ID to filter events
 * @param options - Event callbacks
 * @returns Connection status
 *
 * @example
 * const { isConnected } = useStorageEvents("product-123", {
 *   onBatchReceived: (event) => refetchBatches(),
 *   onLowStock: (event) => showAlert(event.payload),
 *   onExpiring: (event) => showWarning(event.payload),
 * });
 */
export function useStorageEvents(
  productDocumentId?: string,
  options: {
    onBatchReceived?: (event: WSEvent) => void;
    onBatchProcessed?: (event: WSEvent) => void;
    onLowStock?: (event: WSEvent) => void;
    onExpiring?: (event: WSEvent) => void;
    onYieldVariance?: (event: WSEvent) => void;
  } = {}
) {
  // Use Pusher in production when configured
  if (isPusherEnabled()) {
    return usePusherStorageEvents(productDocumentId, options);
  }

  const wsOptions = React.useMemo(
    () => ({
      url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws",
      channels: [
        productDocumentId
          ? (`storage:${productDocumentId}` as SubscriptionChannel)
          : ("storage" as SubscriptionChannel),
      ],
    }),
    [productDocumentId]
  );

  const { lastMessage, isConnected, state } = useWebSocket(wsOptions);

  React.useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case "storage.batch_received":
        options.onBatchReceived?.(lastMessage);
        break;
      case "storage.batch_processed":
        options.onBatchProcessed?.(lastMessage);
        break;
      case "storage.low_stock":
        options.onLowStock?.(lastMessage);
        break;
      case "storage.expiring":
        options.onExpiring?.(lastMessage);
        break;
      case "storage.yield_variance":
        options.onYieldVariance?.(lastMessage);
        break;
    }
  }, [lastMessage, options]);

  return { isConnected, state };
}
