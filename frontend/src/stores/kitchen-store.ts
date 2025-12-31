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
}

// Callback type for when task starts (for inventory deduction)
type TaskStartedCallback = (task: KitchenTask, chefName?: string) => void;

// Registry for task started callbacks
const taskStartedCallbacks: Set<TaskStartedCallback> = new Set();

interface KitchenStore {
  tasks: KitchenTask[];

  // Actions
  addTask: (task: KitchenTask) => void;
  addTasks: (tasks: KitchenTask[]) => void;
  updateTaskStatus: (taskId: string, status: StationSubTaskStatus, assignedChef?: string) => void;
  removeTask: (taskId: string) => void;
  clearCompletedTasks: () => void;

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

export const useKitchenStore = create<KitchenStore>()(
  persist(
    (set, get) => ({
      tasks: [] as KitchenTask[],

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

      updateTaskStatus: (taskId, status, assignedChef) => {
        // Get task before updating for event logging
        const task = get().tasks.find((t) => t.documentId === taskId);

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.documentId === taskId
              ? {
                  ...t,
                  status,
                  assignedChefName: assignedChef || t.assignedChefName,
                }
              : t
          ),
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
