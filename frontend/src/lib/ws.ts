import type { WSEvent, WSEventType, KitchenTicket } from "@/types";
import { mockKitchenTickets, mockMenuItems } from "@/mocks/data";

type WSCallback = (event: WSEvent) => void;

// Mock WebSocket Manager
class MockWebSocketManager {
  private listeners: Map<WSEventType, Set<WSCallback>> = new Map();
  private ticketInterval: NodeJS.Timeout | null = null;
  private connected = false;

  connect(): void {
    if (this.connected) return;

    this.connected = true;
    console.log("[WS] Connected to mock WebSocket");

    // Simulate random new tickets every 15-30 seconds
    this.startTicketSimulation();
  }

  disconnect(): void {
    this.connected = false;
    if (this.ticketInterval) {
      clearInterval(this.ticketInterval);
      this.ticketInterval = null;
    }
    console.log("[WS] Disconnected from mock WebSocket");
  }

  subscribe(eventType: WSEventType, callback: WSCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  private emit(event: WSEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach((callback) => callback(event));
    }
  }

  private startTicketSimulation(): void {
    // Simulate new ticket every 15-30 seconds
    const scheduleNextTicket = () => {
      const delay = 15000 + Math.random() * 15000; // 15-30 sec
      this.ticketInterval = setTimeout(() => {
        if (!this.connected) return;

        const newTicket = this.generateRandomTicket();
        this.emit({
          type: "ticket:new",
          payload: newTicket,
          timestamp: new Date(),
        });

        scheduleNextTicket();
      }, delay);
    };

    scheduleNextTicket();
  }

  private generateRandomTicket(): KitchenTicket {
    const availableItems = mockMenuItems.filter((item) => item.available);
    const numItems = 1 + Math.floor(Math.random() * 3);
    const items = [];

    for (let i = 0; i < numItems; i++) {
      const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
      items.push({
        id: `item-${Date.now()}-${i}`,
        menuItemId: randomItem.id,
        menuItem: randomItem,
        quantity: 1 + Math.floor(Math.random() * 2),
        status: "pending" as const,
      });
    }

    return {
      id: `ticket-${Date.now()}`,
      orderId: `order-${Date.now()}`,
      orderItems: items,
      tableNumber: 1 + Math.floor(Math.random() * 15),
      status: "new",
      createdAt: new Date(),
      elapsedSeconds: 0,
      priority: Math.random() > 0.8 ? "rush" : "normal",
    };
  }

  // Manual trigger for testing
  triggerNewTicket(): void {
    if (!this.connected) return;
    const newTicket = this.generateRandomTicket();
    this.emit({
      type: "ticket:new",
      payload: newTicket,
      timestamp: new Date(),
    });
  }

  triggerTicketUpdate(ticketId: string, status: KitchenTicket["status"]): void {
    if (!this.connected) return;
    this.emit({
      type: "ticket:update",
      payload: { ticketId, status },
      timestamp: new Date(),
    });
  }
}

// Singleton instance
export const wsManager = new MockWebSocketManager();

// React hook for WebSocket subscription
export function useWebSocket(eventType: WSEventType, callback: WSCallback): void {
  // This is a simplified version - in real implementation use useEffect
  // The actual hook is in the features folder
}
