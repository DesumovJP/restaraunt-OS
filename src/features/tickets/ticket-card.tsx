"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDuration, formatTime } from "@/lib/utils";
import { Play, Check, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { KitchenTicket, TicketStatus } from "@/types";

interface TicketCardProps {
  ticket: KitchenTicket;
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
  className?: string;
}

const statusConfig: Record<
  TicketStatus,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  new: { 
    label: "Новий", 
    icon: Clock, 
    color: "text-info", 
    bgColor: "bg-info-light border-info" 
  },
  in_progress: { 
    label: "Готується", 
    icon: Clock, 
    color: "text-warning", 
    bgColor: "bg-warning-light border-warning" 
  },
  ready: { 
    label: "Готово", 
    icon: CheckCircle2, 
    color: "text-success", 
    bgColor: "bg-success-light border-success" 
  },
};

// Time thresholds for color coding (in seconds)
const TIME_WARNING = 600; // 10 minutes
const TIME_DANGER = 900; // 15 minutes

export function TicketCard({
  ticket,
  onStatusChange,
  className,
}: TicketCardProps) {
  const { status, elapsedSeconds, priority, tableNumber, orderItems, createdAt, orderId } = ticket;
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  // Timer color based on elapsed time
  const timerColor =
    elapsedSeconds > TIME_DANGER
      ? "text-danger"
      : elapsedSeconds > TIME_WARNING
        ? "text-warning"
        : "text-muted-foreground";

  // Determine next action
  const nextAction: { status: TicketStatus; label: string; icon: React.ElementType } | null =
    status === "new"
      ? { status: "in_progress", label: "Почати", icon: Play }
      : status === "in_progress"
        ? { status: "ready", label: "Готово", icon: Check }
        : null;

  // Format order ID (last 4 digits)
  const orderNumber = orderId.slice(-4).padStart(4, "0");

  return (
    <Card
      className={cn(
        "relative transition-all duration-200 flex flex-col h-full shadow-sm hover:shadow-md",
        priority === "rush" && "ring-2 ring-danger",
        status === "ready" && "opacity-90",
        className
      )}
      role="article"
      aria-label={`Замовлення #${orderNumber} для столу ${tableNumber}`}
    >
      {/* Header with identifier and status */}
      <div className="p-2.5 pb-2 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          {/* Table identifier */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-foreground">
              Стіл {tableNumber}
            </span>
            {priority === "rush" && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0.5 gap-0.5 h-4">
                <AlertTriangle className="h-2 w-2" />
                Терміново
              </Badge>
            )}
          </div>

          {/* Status badge with icon */}
          <Badge
            className={cn(
              config.bgColor,
              config.color,
              "border flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium"
            )}
            aria-label={`Статус: ${config.label}`}
          >
            <StatusIcon className="h-2.5 w-2.5" />
            {config.label}
          </Badge>
        </div>

        {/* Order info */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>#{orderNumber}</span>
          <span className="flex items-center gap-0.5 font-medium">
            <Clock className="h-2.5 w-2.5" />
            {formatTime(createdAt)}
          </span>
        </div>
      </div>

      {/* Order items list */}
      <div className="p-2.5 flex-1 min-h-0">
        <ul className="space-y-1.5" role="list">
          {orderItems.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-1.5 text-xs"
            >
              <span className="font-semibold text-primary min-w-[1.5rem] shrink-0">
                {item.quantity}x
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-foreground block leading-tight">
                  {item.menuItem.name}
                </span>
                {item.notes && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    {item.notes}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer with timer and actions */}
      <div className="p-2.5 pt-1.5 border-t border-border">
        <div className="flex items-center justify-between gap-2">
          <div
            className={cn("flex items-center gap-1 font-mono text-xs font-semibold", timerColor)}
            aria-label={`Час: ${formatDuration(elapsedSeconds)}`}
          >
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>{formatDuration(elapsedSeconds)}</span>
          </div>

          {/* Action button */}
          {nextAction && (
            <Button
              size="sm"
              variant={nextAction.status === "ready" ? "default" : "default"}
              onClick={() => onStatusChange(ticket.id, nextAction.status)}
              className="gap-1 h-7 px-2.5 text-xs font-medium"
              aria-label={`${nextAction.label} замовлення`}
            >
              <nextAction.icon className="h-3 w-3" />
              {nextAction.label}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
