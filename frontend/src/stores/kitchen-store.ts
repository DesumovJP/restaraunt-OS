import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StationType, StationSubTaskStatus } from "@/types/station";
import type { CourseType, ItemComment } from "@/types/extended";
import { tableSessionEventsApi } from "@/lib/api-events";

export interface KitchenTask {
  documentId: string;
  orderItemDocumentId: string;
  orderDocumentId: string;
  menuItemName: string;
  quantity: number;
  tableNumber: number;
  tableOccupiedAt?: string;
  courseType: CourseType;
  status: StationSubTaskStatus;
  priority: "normal" | "rush" | "vip";
  priorityScore: number;
  elapsedMs: number;
  targetCompletionMs: number;
  isOverdue: boolean;
  assignedChefName?: string;
  modifiers: string[];
  comment: ItemComment | null;
  createdAt: string;
  stationType: StationType;
  // Scheduled order fields
  isScheduled?: boolean;
  scheduledOrderId?: string;

  // Timer tracking timestamps (ISO strings)
  startedAt?: string;     // When cooking started
  readyAt?: string;       // When marked as ready
  servedAt?: string;      // When served to guest

  // Timer phase durations (ms)
  queueMs?: number;       // Queue wait time (createdAt -> startedAt)
  cookMs?: number;        // Cooking time (startedAt -> readyAt)
  pickupMs?: number;      // Pickup wait time (readyAt -> servedAt)

  // Target times for visual indicators
  targetPickupMs?: number; // Expected pickup time (default 2 min)
  isPickupOverdue?: boolean; // Pickup taking too long
}

// Callback type for when task starts (for inventory deduction)
type TaskStartedCallback = (task: KitchenTask, chefName?: string) => void;

// Registry for task started callbacks
const taskStartedCallbacks: Set<TaskStartedCallback> = new Set();

// Backend timestamps that should override local timestamps
interface BackendTimestamps {
  startedAt?: string;
  completedAt?: string;
  servedAt?: string;
}

// Backend KitchenTicket type (from GraphQL)
export interface BackendKitchenTicket {
  documentId: string;
  ticketNumber: string;
  status: string;
  station: string;
  priority: string;
  priorityScore: number;
  startedAt: string | null;
  completedAt: string | null;
  elapsedSeconds: number;
  inventoryLocked: boolean;
  createdAt: string;
  assignedChef?: {
    documentId: string;
    username: string;
  };
  orderItem?: {
    documentId: string;
    quantity: number;
    notes: string | null;
    modifiers: any[];
    menuItem: {
      documentId: string;
      name: string;
      price: number;
      preparationTime: number;
      image?: { url: string };
    };
  };
  order?: {
    documentId: string;
    orderNumber: string;
    table: {
      documentId: string;
      number: number;
    };
  };
}

interface KitchenStore {
  tasks: KitchenTask[];
  lastSyncedAt: string | null;

  // Actions
  addTask: (task: KitchenTask) => void;
  addTasks: (tasks: KitchenTask[]) => void;
  updateTaskStatus: (taskId: string, status: StationSubTaskStatus, assignedChef?: string, backendTimestamps?: BackendTimestamps) => void;
  removeTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
  clearAllTasks: () => void;
  syncFromBackend: (tickets: BackendKitchenTicket[]) => void;

  // Getters
  getTasksByStation: (station: StationType) => KitchenTask[];
  getTasksByOrder: (orderId: string) => KitchenTask[];
  getActiveTasksCount: () => number;
  getOverdueTasksCount: () => number;
}

/**
 * Subscribe to task started events (for inventory deduction)
 * Returns unsubscribe function
 */
export function onTaskStarted(callback: TaskStartedCallback): () => void {
  taskStartedCallbacks.add(callback);
  return () => {
    taskStartedCallbacks.delete(callback);
  };
}

// Helper to determine station type based on menu item or output type
function determineStationType(outputType?: string): StationType {
  switch (outputType) {
    case "bar":
      return "bar";
    case "cold":
      return "cold";
    case "pastry":
      return "pastry";
    case "kitchen":
    default:
      return "hot";
  }
}

// Map backend station enum to frontend StationType
function mapBackendStationToFrontend(station: string): StationType {
  switch (station) {
    case "bar":
      return "bar";
    case "salad":
    case "cold":
      return "cold";
    case "dessert":
    case "pastry":
      return "pastry";
    case "grill":
    case "fry":
    case "hot":
    case "prep":
    default:
      return "hot";
  }
}

// Map backend status to frontend status
function mapBackendStatusToFrontend(status: string): StationSubTaskStatus | null {
  switch (status) {
    case "queued":
      return "pending";
    case "started":
    case "resumed":
      return "in_progress";
    case "ready":
      return "completed";
    case "paused":
      return "in_progress"; // Show paused as in_progress for now
    case "served":
      return null; // Served items should not appear in kitchen queue
    case "cancelled":
    case "failed":
      return null; // Hide cancelled/failed from queue
    default:
      return "pending";
  }
}

// Convert backend ticket to frontend KitchenTask
function convertTicketToTask(ticket: BackendKitchenTicket): KitchenTask | null {
  if (!ticket.orderItem?.menuItem || !ticket.order?.table) {
    console.warn("[Kitchen] Ticket missing required data:", ticket.documentId);
    return null;
  }

  const menuItem = ticket.orderItem.menuItem;
  const order = ticket.order;
  const status = mapBackendStatusToFrontend(ticket.status);

  // Skip served/cancelled/failed tickets - they should not appear in kitchen queue
  if (status === null) {
    return null;
  }

  return {
    documentId: ticket.documentId,
    orderItemDocumentId: ticket.orderItem.documentId,
    orderDocumentId: order.documentId,
    menuItemName: menuItem.name,
    quantity: ticket.orderItem.quantity,
    tableNumber: order.table.number,
    tableOccupiedAt: undefined, // Not available from backend yet
    courseType: "main" as CourseType, // Default
    status,
    priority: (ticket.priority || "normal") as "normal" | "rush" | "vip",
    priorityScore: ticket.priorityScore || 50,
    elapsedMs: (ticket.elapsedSeconds || 0) * 1000,
    targetCompletionMs: (menuItem.preparationTime || 15) * 60 * 1000,
    isOverdue: false, // Will be calculated based on elapsed time
    assignedChefName: ticket.assignedChef?.username,
    modifiers: ticket.orderItem.notes ? [ticket.orderItem.notes] : [],
    comment: null, // Not available from backend
    createdAt: ticket.createdAt,
    stationType: mapBackendStationToFrontend(ticket.station),

    // Timer timestamps from backend
    startedAt: ticket.startedAt || undefined,
    readyAt: ticket.completedAt || undefined,
    servedAt: undefined,

    // Timer durations - will be calculated in UI
    queueMs: ticket.startedAt
      ? new Date(ticket.startedAt).getTime() - new Date(ticket.createdAt).getTime()
      : undefined,
    cookMs: ticket.startedAt && ticket.completedAt
      ? new Date(ticket.completedAt).getTime() - new Date(ticket.startedAt).getTime()
      : undefined,
    pickupMs: 0,
    targetPickupMs: 2 * 60 * 1000, // 2 minutes
    isPickupOverdue: false,
  };
}

export const useKitchenStore = create<KitchenStore>()(
  persist(
    (set, get) => ({
      tasks: [] as KitchenTask[],
      lastSyncedAt: null,

      addTask: (task) => {
        set((state) => ({
          tasks: [task, ...state.tasks],
        }));
      },

      addTasks: (tasks) => {
        set((state) => ({
          tasks: [...tasks, ...state.tasks],
        }));
      },

      updateTaskStatus: (taskId, status, assignedChef, backendTimestamps) => {
        // Get task before updating for event logging
        const task = get().tasks.find((t) => t.documentId === taskId);
        const now = new Date().toISOString();

        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.documentId !== taskId) return t;

            const updates: Partial<KitchenTask> = {
              status,
              assignedChefName: assignedChef || t.assignedChefName,
            };

            // Set timestamps based on status transition
            // Prefer backend timestamps over local ones for multi-user sync
            if (status === "in_progress" && !t.startedAt) {
              updates.startedAt = backendTimestamps?.startedAt || now;
              // Calculate queue wait time based on server timestamp
              const createdTime = new Date(t.createdAt).getTime();
              const startedTime = new Date(updates.startedAt).getTime();
              updates.queueMs = startedTime - createdTime;
            }

            if (status === "completed" && !t.readyAt) {
              updates.readyAt = backendTimestamps?.completedAt || now;
              // Calculate cooking time based on server timestamps
              if (t.startedAt) {
                const startTime = new Date(t.startedAt).getTime();
                const readyTime = new Date(updates.readyAt).getTime();
                updates.cookMs = readyTime - startTime;
              }
              // Reset pickup timer
              updates.pickupMs = 0;
              updates.isPickupOverdue = false;
              updates.targetPickupMs = 2 * 60 * 1000; // 2 minutes
            }

            return { ...t, ...updates };
          }),
        }));

        // Log analytics events (non-blocking)
        if (task) {
          const sessionId = task.orderDocumentId;

          if (status === "in_progress") {
            // Log item_started event
            tableSessionEventsApi.createEvent({
              tableNumber: task.tableNumber,
              sessionId,
              eventType: "item_started",
              actorRole: "chef",
              actorName: assignedChef,
              orderDocumentId: task.orderDocumentId,
              tableOccupiedAt: task.tableOccupiedAt,
              metadata: {
                menuItemName: task.menuItemName,
                station: task.stationType,
                quantity: task.quantity,
                priority: task.priority,
              },
            });

            // Trigger task started callbacks (for inventory deduction)
            // Only for non-bar items (bar uses immediate deduction)
            if (task.stationType !== "bar") {
              taskStartedCallbacks.forEach((callback) => {
                try {
                  callback(task, assignedChef);
                } catch (err) {
                  console.error("[Kitchen] Task started callback error:", err);
                }
              });
            }
          }

          if (status === "completed") {
            // Log item_ready event
            tableSessionEventsApi.createEvent({
              tableNumber: task.tableNumber,
              sessionId,
              eventType: "item_ready",
              actorRole: "chef",
              actorName: task.assignedChefName || assignedChef,
              orderDocumentId: task.orderDocumentId,
              tableOccupiedAt: task.tableOccupiedAt,
              metadata: {
                menuItemName: task.menuItemName,
                station: task.stationType,
                quantity: task.quantity,
                elapsedMs: task.elapsedMs,
                wasOverdue: task.isOverdue,
              },
            });
          }
        }
      },

      removeTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.documentId !== taskId),
        }));
      },

      clearCompletedTasks: () => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.status !== "completed"),
        }));
      },

      clearAllTasks: () => {
        set({ tasks: [], lastSyncedAt: null });
      },

      syncFromBackend: (tickets: BackendKitchenTicket[]) => {
        const currentTasks = get().tasks;
        const now = Date.now();
        const RECENT_UPDATE_THRESHOLD_MS = 15000; // 15 seconds

        // Build a map of current tasks for quick lookup
        const currentTaskMap = new Map(currentTasks.map(t => [t.documentId, t]));

        const newTasks: KitchenTask[] = [];

        for (const ticket of tickets) {
          const backendTask = convertTicketToTask(ticket);
          if (!backendTask) continue;

          const existingTask = currentTaskMap.get(backendTask.documentId);

          // If task exists locally and has a more advanced status, keep local version
          // This prevents backend sync from reverting optimistic UI updates
          if (existingTask) {
            const statusOrder: Record<string, number> = { pending: 0, in_progress: 1, completed: 2 };
            const existingOrder = statusOrder[existingTask.status] ?? 0;
            const backendOrder = statusOrder[backendTask.status] ?? 0;

            // Keep local task if it has more advanced status
            // (local "in_progress" shouldn't be reverted to backend "pending")
            if (existingOrder > backendOrder) {
              console.log(`[Kitchen] Keeping local task (more advanced status):`, {
                id: existingTask.documentId,
                localStatus: existingTask.status,
                backendStatus: backendTask.status,
              });
              newTasks.push(existingTask);
              continue;
            }

            // Keep local timestamps if they exist and backend doesn't have them
            if (existingTask.startedAt && !backendTask.startedAt) {
              backendTask.startedAt = existingTask.startedAt;
              backendTask.queueMs = existingTask.queueMs;
            }
            if (existingTask.readyAt && !backendTask.readyAt) {
              backendTask.readyAt = existingTask.readyAt;
              backendTask.cookMs = existingTask.cookMs;
            }
          }

          newTasks.push(backendTask);
        }

        // Sort by priority score (high to low) then by creation date (old to new)
        newTasks.sort((a, b) => {
          if (a.priorityScore !== b.priorityScore) {
            return b.priorityScore - a.priorityScore;
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        console.log(`[Kitchen] Synced ${newTasks.length} tasks from backend`, {
          pending: newTasks.filter(t => t.status === "pending").length,
          inProgress: newTasks.filter(t => t.status === "in_progress").length,
          completed: newTasks.filter(t => t.status === "completed").length,
        });

        set({
          tasks: newTasks,
          lastSyncedAt: new Date().toISOString(),
        });
      },

      getTasksByStation: (station) => {
        return get().tasks.filter((task) => task.stationType === station);
      },

      getTasksByOrder: (orderId) => {
        return get().tasks.filter((task) => task.orderDocumentId === orderId);
      },

      getActiveTasksCount: () => {
        return get().tasks.filter((task) => task.status === "in_progress").length;
      },

      getOverdueTasksCount: () => {
        return get().tasks.filter((task) => task.isOverdue).length;
      },
    }),
    {
      name: "kitchen-tasks-storage",
      skipHydration: true, // Prevent hydration mismatch - hydrate on client only
    }
  )
);

// Hydrate store on client side
if (typeof window !== "undefined") {
  useKitchenStore.persist.rehydrate();
}

// Helper function to create kitchen tasks from cart items
export function createKitchenTasksFromOrder(
  orderId: string,
  tableNumber: number,
  items: Array<{
    menuItem: {
      id: string;
      name: string;
      outputType?: string;
      preparationTime?: number;
    };
    quantity: number;
    notes?: string;
    comment?: ItemComment | null;
  }>,
  tableOccupiedAt?: string // Actual time when table was occupied (for timer tracking)
): KitchenTask[] {
  const now = new Date().toISOString();

  return items.map((item, index) => {
    // Determine priority based on comment presets (allergies = rush)
    const hasAllergy = item.comment?.presets?.some(
      (p) => p.includes("allergy") || p.includes("gluten") || p.includes("lactose")
    );
    const priority = hasAllergy ? "rush" : "normal";
    const priorityScore = hasAllergy ? 80 : 50;

    return {
      documentId: `task_${orderId}_${index}_${Date.now()}`,
      orderItemDocumentId: `item_${orderId}_${index}`,
      orderDocumentId: orderId,
      menuItemName: item.menuItem.name,
      quantity: item.quantity,
      tableNumber,
      tableOccupiedAt: tableOccupiedAt || now,
      courseType: "main" as CourseType, // Default, can be enhanced
      status: "pending" as StationSubTaskStatus,
      priority: priority as "normal" | "rush" | "vip",
      priorityScore,
      elapsedMs: 0,
      targetCompletionMs: (item.menuItem.preparationTime || 15) * 60 * 1000,
      isOverdue: false,
      modifiers: item.notes ? [item.notes] : [],
      comment: item.comment || null,
      createdAt: now,
      stationType: determineStationType(item.menuItem.outputType),
    };
  });
}
