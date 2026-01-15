"use client";

/**
 * Pusher Hooks
 *
 * Provides React hooks for real-time updates via Pusher.
 * Drop-in replacement for WebSocket hooks with same interface.
 *
 * @module hooks/use-pusher
 *
 * @example
 * // Basic usage
 * const { isConnected } = usePusher({
 *   channels: ["orders", "stations"],
 * });
 *
 * @example
 * // Subscribe to specific events
 * usePusherEvent("order.created", (data) => {
 *   console.log("New order:", data);
 * });
 */

import * as React from "react";
import Pusher, { Channel } from "pusher-js";
import type { WSEvent, WSEventType, SubscriptionChannel } from "@/lib/websocket-events";

// ==========================================
// CONFIGURATION
// ==========================================

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || "";
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu";

// Channel name mapping (WebSocket format -> Pusher format)
function toPusherChannel(channel: SubscriptionChannel): string {
  // Convert "tables:5" to "table-5", "stations:grill" to "station-grill"
  return channel
    .replace(/^tables:(\d+)$/, "table-$1")
    .replace(/^stations:(.+)$/, "station-$1")
    .replace(/^orders:(.+)$/, "order-$1")
    .replace(/^storage:(.+)$/, "storage-$1")
    .replace(/^splits:(.+)$/, "split-$1");
}

// ==========================================
// SINGLETON PUSHER INSTANCE
// ==========================================

let pusherInstance: Pusher | null = null;
let connectionState: "connected" | "connecting" | "disconnected" = "disconnected";
const connectionListeners = new Set<(state: typeof connectionState) => void>();

function getPusher(): Pusher | null {
  if (!PUSHER_KEY) {
    console.warn("[Pusher] No PUSHER_KEY configured, real-time updates disabled");
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
    });

    // Track connection state
    pusherInstance.connection.bind("connected", () => {
      connectionState = "connected";
      connectionListeners.forEach((cb) => cb(connectionState));
    });

    pusherInstance.connection.bind("connecting", () => {
      connectionState = "connecting";
      connectionListeners.forEach((cb) => cb(connectionState));
    });

    pusherInstance.connection.bind("disconnected", () => {
      connectionState = "disconnected";
      connectionListeners.forEach((cb) => cb(connectionState));
    });

    pusherInstance.connection.bind("failed", () => {
      connectionState = "disconnected";
      connectionListeners.forEach((cb) => cb(connectionState));
    });
  }

  return pusherInstance;
}

/**
 * Check if Pusher is configured and available
 */
export function isPusherEnabled(): boolean {
  return !!PUSHER_KEY;
}

// ==========================================
// HOOKS
// ==========================================

type ConnectionState = "connecting" | "connected" | "disconnected" | "reconnecting";

interface UsePusherOptions {
  channels?: SubscriptionChannel[];
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface UsePusherReturn {
  state: ConnectionState;
  isConnected: boolean;
  lastMessage: WSEvent | null;
  subscribe: (channels: SubscriptionChannel[]) => void;
  unsubscribe: (channels: SubscriptionChannel[]) => void;
}

/**
 * Main Pusher hook - connects and manages channel subscriptions
 */
export function usePusher(options: UsePusherOptions = {}): UsePusherReturn {
  const { channels = [], onConnect, onDisconnect, onError } = options;

  const [state, setState] = React.useState<ConnectionState>("disconnected");
  const [lastMessage, setLastMessage] = React.useState<WSEvent | null>(null);
  const subscribedChannelsRef = React.useRef<Map<string, Channel>>(new Map());

  // Subscribe to channels
  const subscribe = React.useCallback((newChannels: SubscriptionChannel[]) => {
    const pusher = getPusher();
    if (!pusher) return;

    newChannels.forEach((channel) => {
      const pusherChannel = toPusherChannel(channel);
      if (!subscribedChannelsRef.current.has(pusherChannel)) {
        const sub = pusher.subscribe(pusherChannel);

        // Bind to all events on this channel
        sub.bind_global((eventName: string, data: unknown) => {
          if (eventName.startsWith("pusher:")) return; // Skip internal events

          setLastMessage({
            type: eventName as WSEventType,
            timestamp: new Date().toISOString(),
            serverTimestamp: (data as Record<string, string>)?.serverTimestamp || new Date().toISOString(),
            sequence: Date.now(),
            payload: data,
          } as WSEvent);
        });

        subscribedChannelsRef.current.set(pusherChannel, sub);
      }
    });
  }, []);

  // Unsubscribe from channels
  const unsubscribe = React.useCallback((channelsToRemove: SubscriptionChannel[]) => {
    const pusher = getPusher();
    if (!pusher) return;

    channelsToRemove.forEach((channel) => {
      const pusherChannel = toPusherChannel(channel);
      if (subscribedChannelsRef.current.has(pusherChannel)) {
        pusher.unsubscribe(pusherChannel);
        subscribedChannelsRef.current.delete(pusherChannel);
      }
    });
  }, []);

  // Initialize connection and subscriptions
  React.useEffect(() => {
    const pusher = getPusher();
    if (!pusher) {
      setState("disconnected");
      return;
    }

    // Track connection state
    const handleStateChange = (newState: typeof connectionState) => {
      setState(newState === "connecting" ? "connecting" : newState);
      if (newState === "connected") {
        onConnect?.();
      } else if (newState === "disconnected") {
        onDisconnect?.();
      }
    };

    connectionListeners.add(handleStateChange);

    // Set initial state
    setState(connectionState);

    // Subscribe to initial channels
    if (channels.length > 0) {
      subscribe(channels);
    }

    // Cleanup
    return () => {
      connectionListeners.delete(handleStateChange);
      // Unsubscribe from all channels
      subscribedChannelsRef.current.forEach((_, channelName) => {
        pusher.unsubscribe(channelName);
      });
      subscribedChannelsRef.current.clear();
    };
  }, [channels, subscribe, onConnect, onDisconnect, onError]);

  return {
    state,
    isConnected: state === "connected",
    lastMessage,
    subscribe,
    unsubscribe,
  };
}

/**
 * Hook for subscribing to specific Pusher event types
 */
export function usePusherEvent<T = unknown>(
  eventType: WSEventType | string,
  onEvent: (data: T) => void,
  channels: SubscriptionChannel[] = ["orders", "stations"]
): { isConnected: boolean } {
  const { isConnected, lastMessage } = usePusher({ channels });

  React.useEffect(() => {
    if (lastMessage && lastMessage.type === eventType) {
      onEvent(lastMessage.payload as T);
    }
  }, [lastMessage, eventType, onEvent]);

  return { isConnected };
}

/**
 * Table Events Hook - Drop-in replacement for useTableEvents
 */
export function useTableEvents(
  tableNumber: number,
  options: {
    onOrderCreated?: (event: WSEvent) => void;
    onItemStatusChanged?: (event: WSEvent) => void;
    onTimerSync?: (event: WSEvent) => void;
    onSLAWarning?: (event: WSEvent) => void;
  } = {}
) {
  const channels = React.useMemo(
    () => [`tables:${tableNumber}` as SubscriptionChannel, "orders" as SubscriptionChannel],
    [tableNumber]
  );

  const { lastMessage, isConnected, state } = usePusher({ channels });

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
 * Station Events Hook - Drop-in replacement for useStationEvents
 */
export function useStationEvents(
  stationType: string,
  options: {
    onTaskCreated?: (event: WSEvent) => void;
    onTaskStarted?: (event: WSEvent) => void;
    onTaskCompleted?: (event: WSEvent) => void;
    onLoadChanged?: (event: WSEvent) => void;
    onOverloadWarning?: (event: WSEvent) => void;
  } = {}
) {
  const channels = React.useMemo(
    () => [`stations:${stationType}` as SubscriptionChannel, "stations" as SubscriptionChannel],
    [stationType]
  );

  const { lastMessage, isConnected, state } = usePusher({ channels });

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
 * Storage Events Hook - Drop-in replacement for useStorageEvents
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
  const channels = React.useMemo(
    () => [
      productDocumentId
        ? (`storage:${productDocumentId}` as SubscriptionChannel)
        : ("storage" as SubscriptionChannel),
      "alerts" as SubscriptionChannel,
    ],
    [productDocumentId]
  );

  const { lastMessage, isConnected, state } = usePusher({ channels });

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

/**
 * Kitchen Events Hook - for kitchen display
 */
export function useKitchenEvents(
  options: {
    onTicketCreated?: (event: WSEvent) => void;
    onTicketStatusChanged?: (event: WSEvent) => void;
    onOrderCancelled?: (event: WSEvent) => void;
  } = {}
) {
  const channels = React.useMemo(() => ["stations" as SubscriptionChannel, "orders" as SubscriptionChannel], []);

  const { lastMessage, isConnected, state } = usePusher({ channels });

  React.useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case "station.task_created":
        options.onTicketCreated?.(lastMessage);
        break;
      case "station.task_started":
      case "station.task_completed":
        options.onTicketStatusChanged?.(lastMessage);
        break;
      case "order.cancelled":
        options.onOrderCancelled?.(lastMessage);
        break;
    }
  }, [lastMessage, options]);

  return { isConnected, state };
}

/**
 * Orders Events Hook - for order management
 */
export function useOrderEvents(
  options: {
    onOrderCreated?: (event: WSEvent) => void;
    onOrderUpdated?: (event: WSEvent) => void;
    onOrderCancelled?: (event: WSEvent) => void;
  } = {}
) {
  const channels = React.useMemo(() => ["orders" as SubscriptionChannel], []);

  const { lastMessage, isConnected, state } = usePusher({ channels });

  React.useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case "order.created":
        options.onOrderCreated?.(lastMessage);
        break;
      case "order.updated":
        options.onOrderUpdated?.(lastMessage);
        break;
      case "order.cancelled":
        options.onOrderCancelled?.(lastMessage);
        break;
    }
  }, [lastMessage, options]);

  return { isConnected, state };
}

export default {
  usePusher,
  usePusherEvent,
  useTableEvents,
  useStationEvents,
  useStorageEvents,
  useKitchenEvents,
  useOrderEvents,
  isPusherEnabled,
};
