"use client";

import { useEffect, useRef, useCallback } from "react";
import { useScheduledOrdersStore, type ScheduledOrder } from "@/stores/scheduled-orders-store";
import { useKitchenStore, createKitchenTasksFromOrder } from "@/stores/kitchen-store";
import { tableSessionEventsApi } from "@/lib/api-events";

const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

interface UseScheduledOrderMonitorOptions {
  enabled?: boolean;
  onOrderActivated?: (order: ScheduledOrder) => void;
  playSound?: boolean;
}

/**
 * Hook that monitors scheduled orders and activates them when prepStartAt time arrives.
 * Should be used in kitchen layout/page to auto-add tasks to queue.
 *
 * @param options.enabled - Whether monitoring is active (default: true)
 * @param options.onOrderActivated - Callback when an order is activated
 * @param options.playSound - Play notification sound on activation (default: true)
 */
export function useScheduledOrderMonitor(options: UseScheduledOrderMonitorOptions = {}) {
  const { enabled = true, onOrderActivated, playSound = true } = options;

  const getOrdersReadyToActivate = useScheduledOrdersStore(
    (state) => state.getOrdersReadyToActivate
  );
  const updateOrderStatus = useScheduledOrdersStore((state) => state.updateOrderStatus);
  const addKitchenTasks = useKitchenStore((state) => state.addTasks);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio on client side
  useEffect(() => {
    if (typeof window !== "undefined" && playSound) {
      audioRef.current = new Audio("/sounds/notification.mp3");
      audioRef.current.volume = 0.5;
    }
  }, [playSound]);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current && playSound) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Audio play may fail if user hasn't interacted with page yet
      });
    }
  }, [playSound]);

  const activateOrder = useCallback(
    (order: ScheduledOrder) => {
      // Update status to activating
      updateOrderStatus(order.id, "activating");

      // Create kitchen tasks for this order
      const kitchenTasks = createKitchenTasksFromOrder(
        order.id,
        order.tableNumber,
        order.items.map((item) => ({
          menuItem: {
            id: item.menuItemId,
            name: item.menuItemName,
            outputType: item.outputType,
            preparationTime: item.preparationTime,
          },
          quantity: item.quantity,
          notes: item.notes,
          comment: item.comment,
        })),
        order.scheduledFor // Use scheduledFor as the reference time
      );

      // Mark tasks as scheduled
      const scheduledTasks = kitchenTasks.map((task) => ({
        ...task,
        isScheduled: true,
        scheduledOrderId: order.id,
      }));

      // Add tasks to kitchen queue
      addKitchenTasks(scheduledTasks);

      // Update status to activated
      updateOrderStatus(order.id, "activated");

      // Log analytics event
      tableSessionEventsApi.createEvent({
        tableNumber: order.tableNumber,
        sessionId: `scheduled_${order.id}`,
        eventType: "order_taken",
        actorRole: "system",
        orderDocumentId: order.id,
        tableOccupiedAt: order.scheduledFor,
        metadata: {
          isScheduled: true,
          scheduledFor: order.scheduledFor,
          prepStartAt: order.prepStartAt,
          itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
          totalAmount: order.totalAmount,
          activatedAt: new Date().toISOString(),
        },
      });

      // Play notification sound
      playNotificationSound();

      // Callback
      onOrderActivated?.(order);

      console.log("[Scheduler] Activated scheduled order:", {
        orderId: order.id,
        tableNumber: order.tableNumber,
        tasksCreated: scheduledTasks.length,
      });
    },
    [updateOrderStatus, addKitchenTasks, playNotificationSound, onOrderActivated]
  );

  const checkAndActivateOrders = useCallback(() => {
    const ordersToActivate = getOrdersReadyToActivate();

    if (ordersToActivate.length > 0) {
      console.log(`[Scheduler] Found ${ordersToActivate.length} orders ready to activate`);
      ordersToActivate.forEach((order) => {
        activateOrder(order);
      });
    }
  }, [getOrdersReadyToActivate, activateOrder]);

  // Manual activation function
  const activateNow = useCallback(
    (orderId: string) => {
      const order = useScheduledOrdersStore.getState().getOrderById(orderId);
      if (order && order.scheduleStatus === "scheduled") {
        activateOrder(order);
        return true;
      }
      return false;
    },
    [activateOrder]
  );

  // Set up interval for checking
  useEffect(() => {
    if (!enabled) return;

    // Check immediately on mount
    checkAndActivateOrders();

    // Set up interval
    const intervalId = setInterval(checkAndActivateOrders, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, checkAndActivateOrders]);

  return {
    activateNow,
    checkNow: checkAndActivateOrders,
  };
}
