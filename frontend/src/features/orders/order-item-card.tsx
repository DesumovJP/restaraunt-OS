"use client";

import * as React from "react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Clock,
  MessageSquare,
  ChevronRight,
  Play,
  Check,
  Send,
  UtensilsCrossed,
  AlertTriangle,
  GripVertical,
  MoreHorizontal,
} from "lucide-react";
import type { OrderItemStatus, CourseType, ItemComment } from "@/types/extended";
import { CourseBadge } from "./course-selector";
import { CommentDisplay } from "./comment-editor";
import { UndoButton } from "./undo-modal";
import type { UndoReasonCode } from "@/types/fsm";

// Status configurations
interface StatusConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  canTransitionTo: OrderItemStatus[];
}

const STATUS_CONFIGS: Record<OrderItemStatus, StatusConfig> = {
  pending: {
    label: "Очікує",
    icon: Clock,
    color: "text-muted-foreground",
    bgColor: "bg-muted border-muted",
    canTransitionTo: ["sent", "cancelled"],
  },
  sent: {
    label: "Відправлено",
    icon: Send,
    color: "text-info",
    bgColor: "bg-info/10 border-info/30",
    canTransitionTo: ["cooking", "cancelled"],
  },
  cooking: {
    label: "Готується",
    icon: UtensilsCrossed,
    color: "text-warning",
    bgColor: "bg-warning/10 border-warning/30",
    canTransitionTo: ["plating"],
  },
  plating: {
    label: "Сервірується",
    icon: UtensilsCrossed,
    color: "text-orange-500",
    bgColor: "bg-orange-50 border-orange-200",
    canTransitionTo: ["ready"],
  },
  ready: {
    label: "Готово",
    icon: Check,
    color: "text-success",
    bgColor: "bg-success/10 border-success/30",
    canTransitionTo: ["served"],
  },
  served: {
    label: "Подано",
    icon: Check,
    color: "text-success",
    bgColor: "bg-success/5 border-success/20",
    canTransitionTo: [],
  },
  cancelled: {
    label: "Скасовано",
    icon: AlertTriangle,
    color: "text-danger",
    bgColor: "bg-danger/5 border-danger/20",
    canTransitionTo: [],
  },
};

// Format duration from milliseconds
function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Time thresholds for color coding (in ms)
const TIME_WARNING = 10 * 60 * 1000; // 10 minutes
const TIME_DANGER = 15 * 60 * 1000; // 15 minutes

interface OrderItemCardProps {
  documentId: string;
  slug: string;
  menuItemName: string;
  quantity: number;
  price: number;
  status: OrderItemStatus;
  courseType: CourseType;
  courseIndex: number;
  prepElapsedMs: number;
  comment: ItemComment | null;
  station?: string;
  modifiers?: string[];
  isRush?: boolean;
  onStatusChange: (documentId: string, newStatus: OrderItemStatus) => void;
  onUndo: (documentId: string, reason: UndoReasonCode, customReason?: string) => void;
  onEditComment: (documentId: string) => void;
  onEditCourse: (documentId: string) => void;
  isDraggable?: boolean;
  isCompact?: boolean;
  className?: string;
}

export function OrderItemCard({
  documentId,
  slug,
  menuItemName,
  quantity,
  price,
  status,
  courseType,
  courseIndex,
  prepElapsedMs,
  comment,
  station,
  modifiers = [],
  isRush = false,
  onStatusChange,
  onUndo,
  onEditComment,
  onEditCourse,
  isDraggable = false,
  isCompact = false,
  className,
}: OrderItemCardProps) {
  const config = STATUS_CONFIGS[status];
  const StatusIcon = config.icon;

  // Timer color based on elapsed time
  const timerColor =
    prepElapsedMs > TIME_DANGER
      ? "text-danger"
      : prepElapsedMs > TIME_WARNING
        ? "text-warning"
        : "text-muted-foreground";

  // Determine next action
  const nextStatus = config.canTransitionTo[0];
  const nextAction = nextStatus
    ? {
        status: nextStatus,
        label: STATUS_CONFIGS[nextStatus].label,
        icon: STATUS_CONFIGS[nextStatus].icon,
      }
    : null;

  // Check if can undo
  const canUndo = ["sent", "cooking", "plating", "ready"].includes(status);
  const undoTargetStatus: OrderItemStatus =
    status === "sent"
      ? "pending"
      : status === "cooking"
        ? "sent"
        : status === "plating"
          ? "cooking"
          : status === "ready"
            ? "plating"
            : "pending";

  const hasAllergen = comment?.presets.some((preset) =>
    ["gluten_free", "dairy_free", "nut_free", "shellfish_free"].includes(preset)
  );

  if (isCompact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg border transition-all",
          config.bgColor,
          isRush && "ring-2 ring-danger",
          className
        )}
      >
        {isDraggable && (
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">{quantity}x</span>
            <span className="font-medium text-sm truncate">{menuItemName}</span>
          </div>
          {comment && <CommentDisplay comment={comment} size="sm" />}
        </div>

        <CourseBadge course={courseType} size="sm" />

        <div className={cn("font-mono text-xs", timerColor)}>
          {formatDurationMs(prepElapsedMs)}
        </div>

        {nextAction && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => onStatusChange(documentId, nextAction.status)}
          >
            <nextAction.icon className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "relative transition-all duration-200",
        isRush && "ring-2 ring-danger",
        className
      )}
    >
      {/* Header */}
      <div className={cn("p-3 border-b", config.bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDraggable && (
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            )}
            <Badge variant="outline" className={cn("gap-1", config.color)}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
            {isRush && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Терміново
              </Badge>
            )}
            {hasAllergen && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                Алерген
              </Badge>
            )}
          </div>
          <div className={cn("flex items-center gap-1 font-mono text-xs", timerColor)}>
            <Clock className="h-3 w-3" />
            {formatDurationMs(prepElapsedMs)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Item name and quantity */}
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-lg text-primary">{quantity}x</span>
              <h4 className="font-semibold text-base">{menuItemName}</h4>
            </div>

            {/* Course badge */}
            <div className="flex items-center gap-2 mt-1.5">
              <button
                onClick={() => onEditCourse(documentId)}
                className="hover:opacity-80 transition-opacity"
              >
                <CourseBadge course={courseType} size="md" />
              </button>
              <span className="text-xs text-muted-foreground">
                Курс {courseIndex + 1}
              </span>
              {station && (
                <Badge variant="secondary" className="text-xs">
                  {station}
                </Badge>
              )}
            </div>

            {/* Modifiers */}
            {modifiers.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {modifiers.map((mod, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {mod}
                  </Badge>
                ))}
              </div>
            )}

            {/* Comment */}
            {comment && (
              <div className="mt-2">
                <CommentDisplay comment={comment} size="md" maxPresets={4} />
              </div>
            )}
          </div>

          {/* Price */}
          <div className="text-right">
            <span className="font-semibold">{formatPrice(price * quantity)}</span>
            {quantity > 1 && (
              <p className="text-xs text-muted-foreground">
                {formatPrice(price)} / шт
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-3 pt-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onEditComment(documentId)}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Коментар
          </Button>

          <UndoButton
            itemDocumentId={documentId}
            itemName={menuItemName}
            currentStatus={status}
            canUndo={canUndo}
            targetStatus={undoTargetStatus}
            onUndo={(reason, customReason) => onUndo(documentId, reason, customReason)}
            size="md"
          />
        </div>

        {nextAction && (
          <Button
            size="sm"
            onClick={() => onStatusChange(documentId, nextAction.status)}
            className="gap-1"
          >
            <nextAction.icon className="h-4 w-4" />
            {nextAction.label}
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Card>
  );
}

// List wrapper for order items grouped by course
interface OrderItemsListProps {
  items: Array<{
    documentId: string;
    slug: string;
    menuItemName: string;
    quantity: number;
    price: number;
    status: OrderItemStatus;
    courseType: CourseType;
    courseIndex: number;
    prepElapsedMs: number;
    comment: ItemComment | null;
    station?: string;
    modifiers?: string[];
    isRush?: boolean;
  }>;
  groupByCourse?: boolean;
  onStatusChange: (documentId: string, newStatus: OrderItemStatus) => void;
  onUndo: (documentId: string, reason: UndoReasonCode, customReason?: string) => void;
  onEditComment: (documentId: string) => void;
  onEditCourse: (documentId: string) => void;
  className?: string;
}

export function OrderItemsList({
  items,
  groupByCourse = true,
  onStatusChange,
  onUndo,
  onEditComment,
  onEditCourse,
  className,
}: OrderItemsListProps) {
  if (!groupByCourse) {
    return (
      <div className={cn("space-y-3", className)}>
        {items.map((item) => (
          <OrderItemCard
            key={item.documentId}
            {...item}
            onStatusChange={onStatusChange}
            onUndo={onUndo}
            onEditComment={onEditComment}
            onEditCourse={onEditCourse}
          />
        ))}
      </div>
    );
  }

  // Group by course
  const courseOrder: CourseType[] = [
    "appetizer",
    "starter",
    "soup",
    "main",
    "dessert",
    "drink",
  ];

  const groupedItems = courseOrder.reduce(
    (acc, course) => {
      acc[course] = items.filter((item) => item.courseType === course);
      return acc;
    },
    {} as Record<CourseType, typeof items>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {courseOrder.map((course) => {
        const courseItems = groupedItems[course];
        if (courseItems.length === 0) return null;

        return (
          <div key={course}>
            <div className="flex items-center gap-2 mb-2">
              <CourseBadge course={course} size="md" />
              <span className="text-sm text-muted-foreground">
                {courseItems.length} позицій
              </span>
            </div>
            <div className="space-y-2">
              {courseItems.map((item) => (
                <OrderItemCard
                  key={item.documentId}
                  {...item}
                  onStatusChange={onStatusChange}
                  onUndo={onUndo}
                  onEditComment={onEditComment}
                  onEditCourse={onEditCourse}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
