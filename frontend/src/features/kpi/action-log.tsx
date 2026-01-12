"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  History,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  Settings,
  Calendar,
  Cog,
  ChevronDown,
} from "lucide-react";
import type { ActionLog } from "@/types";

interface ActionLogViewProps {
  logs: ActionLog[];
  className?: string;
  isLoading?: boolean;
  fullHeight?: boolean;
}

const moduleConfig: Record<
  ActionLog["module"],
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  pos: {
    icon: ShoppingCart,
    color: "text-primary",
    bgColor: "bg-primary-light",
  },
  kitchen: {
    icon: UtensilsCrossed,
    color: "text-warning",
    bgColor: "bg-warning-light",
  },
  storage: {
    icon: Package,
    color: "text-info",
    bgColor: "bg-info-light",
  },
  admin: {
    icon: Settings,
    color: "text-secondary",
    bgColor: "bg-secondary-light",
  },
  reservations: {
    icon: Calendar,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  system: {
    icon: Cog,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

const FIELD_LABELS_UK: Record<string, string> = {
  status: "Статус",
  totalAmount: "Загальна сума",
  quantity: "Кількість",
  price: "Ціна",
  name: "Назва",
  description: "Опис",
  tableNumber: "Номер столика",
  guestCount: "Кількість гостей",
  notes: "Примітки",
  comment: "Коментар",
  priority: "Пріоритет",
  assignedTo: "Призначено",
  completedAt: "Завершено о",
  startedAt: "Розпочато о",
  items: "Позиції",
  orderNumber: "Номер замовлення",
  ticketNumber: "Номер тікету",
  station: "Станція",
  isPaid: "Оплачено",
  paymentMethod: "Спосіб оплати",
  zone: "Зона",
  capacity: "Місткість",
  total: "Всього",
  ordersCount: "Замовлень",
  itemsCount: "Позицій",
  tipAmount: "Чайові",
  durationFormatted: "Тривалість",
  method: "Метод",
  closedBy: "Закрив",
  averageOrderValue: "Середній чек",
  menuItemName: "Страва",
  cookingTimeSeconds: "Час приготування",
  cookingTimeFormatted: "Час приготування",
  pickupWaitSeconds: "Очікування видачі",
  elapsedSeconds: "Час готування",
  sessionDuration: "Тривалість сесії",
  sessionDurationMinutes: "Час за столом",
  totalCost: "Собівартість",
  ingredient: "Інгредієнт",
  batch: "Партія",
  unit: "Одиниця",
  expiryDate: "Термін придатності",
  reason: "Причина",
  servedAt: "Подано о",
  orderReady: "Замовлення готове",
  revenuePerMinute: "Виручка/хв",
  pickupWaitFormatted: "Очікування видачі",
  totalTimeFormatted: "Загальний час",
  queueTime: "В черзі",
};

// Fields to hide from metadata display (technical/internal)
const HIDDEN_FIELDS = new Set([
  "processingTimeMs",
  "entityId",
  "documentId",
  "previousStatus",
  "newStatus",
  "ticketStatus",
  "inventoryLocked",
  "chefId",
  "session", // Extracted separately
  "revenue", // Extracted separately
  "payment", // Extracted separately
  "orders", // Displayed as detailed list
  "timings", // Extracted separately
  "timingsFormatted", // Extracted separately
  "timestamps",
  "dataBefore",
  "dataAfter",
  "consumptionDetails",
  "ingredientsUsed",
  "stockBefore",
  "stockAfter",
  "capacity",
  "notes",
]);

const STATUS_LABELS_UK: Record<string, string> = {
  pending: "Очікує",
  in_progress: "В роботі",
  ready: "Готово",
  completed: "Завершено",
  cancelled: "Скасовано",
  confirmed: "Підтверджено",
  cooking: "Готується",
  served: "Подано",
  paid: "Оплачено",
  free: "Вільний",
  occupied: "Зайнятий",
  reserved: "Заброньований",
  started: "Розпочато",
  queued: "В черзі",
  cash: "Готівка",
  card: "Картка",
  terrace: "Тераса",
  main: "Основний зал",
  bar: "Бар",
  vip: "VIP",
};

const ACTION_LABELS_UK: Record<string, string> = {
  create: "Створено",
  update: "Оновлено",
  delete: "Видалено",
  start: "Розпочато",
  complete: "Завершено",
  cancel: "Скасовано",
  receive: "Отримано",
  write_off: "Списано",
  transfer: "Переміщено",
  approve: "Схвалено",
  reject: "Відхилено",
  assign: "Призначено",
};

export function ActionLogView({ logs, className, isLoading, fullHeight }: ActionLogViewProps) {
  return (
    <Card className={cn(className, fullHeight && "flex flex-col h-full")}>
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Журнал дій
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(fullHeight && "flex-1 overflow-hidden")}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-2 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Немає записів
          </p>
        ) : (
          <div className={cn(
            "space-y-1 overflow-y-auto",
            fullHeight ? "h-full" : "max-h-[400px]"
          )}>
            {logs.map((log) => (
              <LogItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LogItem({ log }: { log: ActionLog }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const config = moduleConfig[log.module] || moduleConfig.system;
  const Icon = config.icon;

  // Only show details if there's meaningful metadata (after filtering)
  const hasDetails = log.metadata && Object.keys(log.metadata).some(k => !HIDDEN_FIELDS.has(k));

  // Use Ukrainian action label
  const actionLabel = ACTION_LABELS_UK[log.action] || log.action;

  // Use Ukrainian description if available, otherwise entity name
  const description = log.descriptionUk || log.entityName || log.details;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            "flex items-start gap-3 p-2 rounded-lg transition-colors cursor-pointer",
            isOpen ? "bg-muted/70" : "hover:bg-muted/50"
          )}
        >
          {/* Module icon */}
          <div
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              config.bgColor
            )}
          >
            <Icon className={cn("h-4 w-4", config.color)} aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{log.userName}</span>
              <span className="text-muted-foreground text-sm">•</span>
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {actionLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {description}
            </p>
          </div>

          {/* Time and expand */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(new Date(log.timestamp))}
            </span>
            {hasDetails && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      {hasDetails && (
        <CollapsibleContent>
          <div className="ml-11 mr-2 mb-2 p-3 bg-muted/30 rounded-lg border text-sm space-y-3">

            {/* Session summary for table close */}
            {log.metadata && (log.metadata as any).session && (
              <SessionSummary metadata={log.metadata as Record<string, unknown>} />
            )}

            {/* Orders detail for table close */}
            {log.metadata && Array.isArray((log.metadata as any).orders) && (log.metadata as any).orders.length > 0 && (
              <OrdersDetail orders={(log.metadata as any).orders} />
            )}

            {/* General metadata - for non-table actions */}
            {log.metadata && !(log.metadata as any).session && Object.keys(log.metadata).length > 0 && (
              <MetadataDisplay metadata={log.metadata} />
            )}

            {/* Severity badge */}
            {log.severity && log.severity !== "info" && (
              <Badge
                variant={log.severity === "critical" ? "destructive" : "outline"}
                className={cn(
                  "text-xs",
                  log.severity === "warning" && "border-warning text-warning"
                )}
              >
                {log.severity === "warning" ? "Увага" : "Критично"}
              </Badge>
            )}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

function formatValue(value: unknown, field: string): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Так" : "Ні";
  if (typeof value === "number") {
    // Format money fields
    if (field.toLowerCase().includes("amount") ||
        field.toLowerCase().includes("price") ||
        field.toLowerCase().includes("cost") ||
        field.toLowerCase().includes("revenue") ||
        field === "total" ||
        field === "averageOrderValue" ||
        field === "revenuePerMinute") {
      return `${value.toFixed(2)} ₴`;
    }
    // Format time in seconds (cooking time, pickup wait, etc.)
    if (field.toLowerCase().includes("seconds") || field === "elapsedSeconds") {
      if (value === 0) return "0с";
      const mins = Math.floor(value / 60);
      const secs = Math.round(value % 60);
      if (mins >= 60) {
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return `${hours}г ${remainingMins}хв`;
      }
      return mins > 0 ? `${mins}хв ${secs}с` : `${secs}с`;
    }
    // Format time in minutes
    if (field.toLowerCase().includes("minutes") || field === "sessionDurationMinutes") {
      if (value === 0) return "0 хв";
      if (value >= 60) {
        const hours = Math.floor(value / 60);
        const mins = Math.round(value % 60);
        return `${hours}г ${mins}хв`;
      }
      return `${Math.round(value)} хв`;
    }
    return String(value);
  }
  if (typeof value === "string") {
    // Try to translate status values
    if (STATUS_LABELS_UK[value]) return STATUS_LABELS_UK[value];
    // Format dates (show only time if today)
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
      }
      return date.toLocaleString("uk-UA");
    }
    return value;
  }
  if (Array.isArray(value)) {
    return `${value.length} елем.`;
  }
  if (typeof value === "object") {
    // Don't show complex objects as JSON
    return "—";
  }
  return String(value);
}

/**
 * Priority order for displaying fields (most important first)
 */
const FIELD_PRIORITY: string[] = [
  // Item identification
  "menuItemName",
  "orderNumber",
  "tableNumber",
  // Timing (most important for kitchen)
  "cookingTimeFormatted",
  "cookingTimeSeconds",
  "elapsedSeconds",
  "pickupWaitFormatted",
  "pickupWaitSeconds",
  "totalTimeFormatted",
  // Session/table timing
  "durationFormatted",
  "sessionDurationMinutes",
  // Revenue
  "total",
  "ordersCount",
  "guestCount",
  "paymentMethod",
  "tipAmount",
  // Other
  "quantity",
  "zone",
  "closedBy",
];

/**
 * Extract displayable fields from metadata, including nested important values
 */
function extractDisplayableMetadata(metadata: Record<string, unknown>): Array<{ key: string; value: unknown }> {
  const result: Array<{ key: string; value: unknown }> = [];

  for (const [key, value] of Object.entries(metadata)) {
    // Skip hidden fields
    if (HIDDEN_FIELDS.has(key)) continue;

    // Handle nested objects - extract important values
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const nested = value as Record<string, unknown>;

      // Extract specific important nested fields
      if (key === "session") {
        if (nested.durationFormatted) {
          result.push({ key: "durationFormatted", value: nested.durationFormatted });
        } else if (nested.durationMinutes) {
          result.push({ key: "sessionDurationMinutes", value: `${nested.durationMinutes} хв` });
        }
        if (nested.guestCount && Number(nested.guestCount) > 0) {
          result.push({ key: "guestCount", value: nested.guestCount });
        }
      } else if (key === "revenue") {
        if (nested.total) result.push({ key: "total", value: nested.total });
        if (nested.ordersCount) result.push({ key: "ordersCount", value: nested.ordersCount });
        if (nested.tipAmount && Number(nested.tipAmount) > 0) {
          result.push({ key: "tipAmount", value: nested.tipAmount });
        }
      } else if (key === "payment" && nested.method) {
        result.push({ key: "paymentMethod", value: nested.method });
      } else if (key === "timingsFormatted") {
        // Extract formatted timing values for kitchen tickets
        if (nested.cookingTime) result.push({ key: "cookingTimeFormatted", value: nested.cookingTime });
        if (nested.pickupWait && nested.pickupWait !== "0м 0с") {
          result.push({ key: "pickupWaitFormatted", value: nested.pickupWait });
        }
        if (nested.totalTime) result.push({ key: "totalTimeFormatted", value: nested.totalTime });
      } else if (key === "timings") {
        // Extract raw timing values if formatted not available
        if (nested.cookingTimeSeconds) result.push({ key: "cookingTimeSeconds", value: nested.cookingTimeSeconds });
        if (nested.pickupWaitSeconds && Number(nested.pickupWaitSeconds) > 0) {
          result.push({ key: "pickupWaitSeconds", value: nested.pickupWaitSeconds });
        }
      }
      // Skip other nested objects
      continue;
    }

    // Add primitive values
    result.push({ key, value });
  }

  // Sort by priority
  result.sort((a, b) => {
    const aPriority = FIELD_PRIORITY.indexOf(a.key);
    const bPriority = FIELD_PRIORITY.indexOf(b.key);
    // Fields in priority list come first, sorted by their order
    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;
    return 0;
  });

  return result;
}

function MetadataDisplay({ metadata }: { metadata: Record<string, unknown> }) {
  const displayableFields = extractDisplayableMetadata(metadata);

  if (displayableFields.length === 0) return null;

  return (
    <div>
      <p className="text-muted-foreground mb-1.5">Деталі:</p>
      <div className="text-xs bg-background p-2 rounded grid grid-cols-2 gap-x-4 gap-y-1">
        {displayableFields.map(({ key, value }) => (
          <div key={key} className="flex gap-2">
            <span className="font-medium text-muted-foreground">
              {FIELD_LABELS_UK[key] || key}:
            </span>
            <span className="truncate">{formatValue(value, key)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Format seconds to human readable string
 */
function formatSeconds(seconds: number | null): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    return `${hours}г ${mins % 60}хв`;
  }
  return mins > 0 ? `${mins}хв ${secs}с` : `${secs}с`;
}

/**
 * Session summary component for table close logs
 */
function SessionSummary({ metadata }: { metadata: Record<string, unknown> }) {
  const session = metadata.session as Record<string, unknown> | undefined;
  const revenue = metadata.revenue as Record<string, unknown> | undefined;
  const payment = metadata.payment as Record<string, unknown> | undefined;

  if (!session) return null;

  return (
    <div className="space-y-2">
      <p className="font-medium text-foreground">📋 Сесія столу</p>
      <div className="text-xs bg-background p-3 rounded border space-y-2">
        {/* Time info */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-muted-foreground">Початок: </span>
            <span>{session.startedAt ? new Date(session.startedAt as string).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Закінчення: </span>
            <span>{session.endedAt ? new Date(session.endedAt as string).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Тривалість: </span>
            <span className="font-medium">{session.durationFormatted ? String(session.durationFormatted) : "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Гостей: </span>
            <span>{session.guestCount ? String(session.guestCount) : "—"}</span>
          </div>
        </div>

        {revenue ? (
          <div className="pt-2 border-t grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">Всього: </span>
              <span className="font-medium text-green-600">{((revenue.total as number) || 0).toFixed(2)} ₴</span>
            </div>
            <div>
              <span className="text-muted-foreground">Замовлень: </span>
              <span>{String((revenue.ordersCount as number) || 0)}</span>
            </div>
            {Number(revenue.tipAmount) > 0 && (
              <div>
                <span className="text-muted-foreground">Чайові: </span>
                <span className="text-green-600">{(Number(revenue.tipAmount) || 0).toFixed(2)} ₴</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Оплата: </span>
              <span>{STATUS_LABELS_UK[String(payment?.method)] || String(payment?.method || "готівка")}</span>
            </div>
          </div>
        ) : null}

        {/* Closed by */}
        {metadata.closedBy ? (
          <div className="pt-2 border-t">
            <span className="text-muted-foreground">Закрив: </span>
            <span>{String(metadata.closedBy)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  portion: string | null;
  comment: string | null;
  cookingTimeSeconds: number | null;
  waitTimeSeconds: number | null;
}

interface OrderSummary {
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  waiter: string | null;
  items: OrderItem[];
}

/**
 * Orders detail component for table close logs
 */
function OrdersDetail({ orders }: { orders: OrderSummary[] }) {
  if (!orders || orders.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="font-medium text-foreground">🍽️ Замовлення ({orders.length})</p>
      <div className="space-y-3">
        {orders.map((order, orderIdx) => (
          <div key={orderIdx} className="text-xs bg-background p-3 rounded border">
            {/* Order header */}
            <div className="flex justify-between items-start mb-2 pb-2 border-b">
              <div>
                <span className="font-medium">{order.orderNumber}</span>
                {order.waiter && (
                  <span className="text-muted-foreground ml-2">• Офіціант: {order.waiter}</span>
                )}
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">{order.totalAmount.toFixed(2)} ₴</div>
                <div className="text-muted-foreground">
                  {new Date(order.createdAt).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>

            {/* Items list */}
            <div className="space-y-1.5">
              {order.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.portion && (
                        <span className="text-muted-foreground text-[11px]">({item.portion})</span>
                      )}
                      {item.quantity > 1 && (
                        <span className="text-muted-foreground">x{item.quantity}</span>
                      )}
                    </div>
                    {item.comment && (
                      <div className="text-muted-foreground italic text-[11px] mt-0.5">
                        💬 {item.comment}
                      </div>
                    )}
                    {(item.cookingTimeSeconds || item.waitTimeSeconds) && (
                      <div className="text-muted-foreground text-[11px] mt-0.5 flex gap-3">
                        {item.cookingTimeSeconds && (
                          <span>⏱️ Готування: {formatSeconds(item.cookingTimeSeconds)}</span>
                        )}
                        {item.waitTimeSeconds && item.waitTimeSeconds > 0 && (
                          <span>⏳ Очікування: {formatSeconds(item.waitTimeSeconds)}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-muted-foreground ml-2">
                    {item.price.toFixed(2)} ₴
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
