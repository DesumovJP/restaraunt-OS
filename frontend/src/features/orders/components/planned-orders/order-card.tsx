"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Users,
  ChevronDown,
  ChevronRight,
  UtensilsCrossed,
  AlertCircle,
  CheckCircle2,
  Timer,
  Play,
  Phone,
  Mail,
  CreditCard,
  Cake,
  PartyPopper,
  MapPin,
  FileText,
  Edit,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import { EVENT_TYPES, SEATING_AREAS, PAYMENT_STATUSES } from "./config";
import { getTimeDisplay } from "./utils";
import type { OrderCardProps, PlannedOrder } from "./types";

/**
 * Get status badge for order
 */
function getStatusBadge(status: PlannedOrder["status"]) {
  switch (status) {
    case "scheduled":
      return (
        <Badge variant="outline" className="gap-1 border-purple-300 text-purple-700 bg-purple-50">
          <Clock className="h-3 w-3" />
          Заплановано
        </Badge>
      );
    case "activating":
      return (
        <Badge variant="warning" className="gap-1">
          <Timer className="h-3 w-3 animate-spin" />
          Активується
        </Badge>
      );
    case "activated":
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          На кухні
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="secondary" className="gap-1">
          <UtensilsCrossed className="h-3 w-3" />
          Виконано
        </Badge>
      );
  }
}

/**
 * Single planned order card with expandable details
 */
export function OrderCard({
  order,
  variant,
  isExpanded,
  onToggleExpand,
  onActivate,
  onComplete,
  onViewDetails,
  onDelete,
}: OrderCardProps) {
  const timeDisplay = getTimeDisplay(order.scheduledTime);
  const eventConfig = order.eventType ? EVENT_TYPES[order.eventType] : null;
  const EventIcon = eventConfig?.icon || Calendar;
  const isOverdueScheduled = timeDisplay.isOverdue && order.status === "scheduled";
  const isEvent = order.eventType && order.eventType !== "regular";

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200",
        "hover:shadow-md",
        isOverdueScheduled && "border-red-300 bg-red-50/50 dark:bg-red-950/20",
        isEvent && "border-l-4 border-l-purple-400",
        isExpanded && "ring-1 ring-primary/20"
      )}
    >
      {/* Main row */}
      <div
        className={cn(
          "p-3 cursor-pointer transition-colors",
          "hover:bg-muted/40 active:bg-muted/60"
        )}
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Table/Event icon - Combined with expand indicator */}
          <div className="relative shrink-0">
            <div
              className={cn(
                "w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm",
                "transition-transform duration-200",
                isExpanded && "scale-95",
                isEvent
                  ? "bg-gradient-to-br from-purple-500 to-purple-600"
                  : variant === "kitchen"
                    ? "bg-gradient-to-br from-orange-500 to-orange-600"
                    : "bg-gradient-to-br from-blue-500 to-blue-600"
              )}
            >
              {isEvent ? (
                <EventIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <span className="text-lg sm:text-xl">{order.tableNumber}</span>
              )}
            </div>
            {/* Expand indicator badge */}
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center",
              "bg-background border shadow-sm transition-transform duration-200",
              isExpanded && "rotate-90"
            )}>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
              <span className="font-semibold text-sm sm:text-base truncate">
                {order.eventName || `Столик ${order.tableNumber}`}
              </span>
              {isEvent && (
                <Badge
                  variant="outline"
                  className={cn("text-[10px] sm:text-xs px-1.5 h-5", eventConfig?.color)}
                >
                  {eventConfig?.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {order.guestCount}
                {order.childrenCount ? ` (+${order.childrenCount})` : ""}
              </span>
              {order.seatingArea && (
                <span className="flex items-center gap-1 hidden sm:flex">
                  <MapPin className="h-3 w-3" />
                  {SEATING_AREAS[order.seatingArea]}
                </span>
              )}
              {order.items.length > 0 && (
                <span className="flex items-center gap-1">
                  <UtensilsCrossed className="h-3 w-3" />
                  {order.items.length}
                </span>
              )}
            </div>
          </div>

          {/* Time + Quick action */}
          <div className="shrink-0 flex items-center gap-2">
            {/* Time display */}
            <div className="text-right">
              <div
                className={cn(
                  "text-sm sm:text-base font-bold tabular-nums",
                  isOverdueScheduled ? "text-red-600" : "text-foreground"
                )}
              >
                {timeDisplay.time}
              </div>
              <div
                className={cn(
                  "text-[10px] sm:text-xs",
                  isOverdueScheduled ? "text-red-500" : "text-muted-foreground"
                )}
              >
                {timeDisplay.relative}
              </div>
            </div>

            {/* Quick action button for kitchen - visible without expanding */}
            {variant === "kitchen" && order.status === "scheduled" && onActivate && (
              <Button
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onActivate(order.id);
                }}
                className={cn(
                  "h-10 w-10 sm:h-11 sm:w-11 rounded-xl shrink-0",
                  "bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
                  "shadow-md hover:shadow-lg transition-all active:scale-95"
                )}
                title="Активувати зараз"
              >
                <Zap className="h-5 w-5" />
              </Button>
            )}

            {/* Status badge - hidden on mobile if quick action is shown */}
            <div className={cn(
              "shrink-0",
              variant === "kitchen" && order.status === "scheduled" && "hidden sm:block"
            )}>
              {getStatusBadge(order.status)}
            </div>
          </div>
        </div>

        {/* Payment status for events - compact row */}
        {order.paymentStatus && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <Badge
              variant="outline"
              className={cn("text-[10px] sm:text-xs", PAYMENT_STATUSES[order.paymentStatus].color)}
            >
              {PAYMENT_STATUSES[order.paymentStatus].label}
            </Badge>
            {order.depositAmount && (
              <span className="text-xs text-muted-foreground">
                Завдаток: <strong className="text-foreground">{order.depositAmount} грн</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t bg-muted/20 animate-in slide-in-from-top-2 duration-200">
          {/* Contact info */}
          {order.contact && (
            <div className="px-3 py-2.5 border-b bg-background/50">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-sm">{order.contact.name}</span>
                </div>
                <a
                  href={`tel:${order.contact.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm hover:bg-green-100 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {order.contact.phone}
                </a>
                {order.contact.email && (
                  <a
                    href={`mailto:${order.contact.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{order.contact.email}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="p-3 space-y-3">
            {/* Special requests - Highlighted */}
            {order.specialRequests && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">Особливі побажання</p>
                  <p className="text-sm text-amber-900 dark:text-amber-200">{order.specialRequests}</p>
                </div>
              </div>
            )}

            {/* Cake/Decorations - Visual cards */}
            {(order.cakeDetails || order.decorations) && (
              <div className="flex gap-2 flex-wrap">
                {order.cakeDetails && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-50 dark:bg-pink-950/50 border border-pink-200 dark:border-pink-800">
                    <Cake className="h-4 w-4 text-pink-500" />
                    <span className="text-sm text-pink-700 dark:text-pink-300">{order.cakeDetails}</span>
                  </div>
                )}
                {order.decorations && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800">
                    <PartyPopper className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-purple-700 dark:text-purple-300">{order.decorations}</span>
                  </div>
                )}
              </div>
            )}

            {/* Items list - Enhanced */}
            {order.items.length > 0 && (
              <div className="rounded-xl border bg-background p-2.5">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Меню ({order.items.length})
                  </span>
                </div>
                <div className="space-y-1">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-xs font-bold">
                          {item.quantity}
                        </span>
                        <span>{item.menuItemName}</span>
                      </div>
                      {variant === "kitchen" && item.station && (
                        <Badge variant="secondary" className="text-[10px]">
                          {item.station}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions - Touch-optimized */}
            <div className="flex gap-2 pt-1">
              {variant === "kitchen" ? (
                <>
                  {order.status === "scheduled" && onActivate && (
                    <Button
                      size="lg"
                      className={cn(
                        "flex-1 h-11 rounded-xl",
                        "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",
                        "shadow-md hover:shadow-lg transition-all"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onActivate(order.id);
                      }}
                    >
                      <Zap className="h-4 w-4 mr-1.5" />
                      Активувати зараз
                    </Button>
                  )}
                  {order.status === "activated" && onComplete && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 h-11 rounded-xl border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        onComplete(order.id);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Позначити виконаним
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {onViewDetails && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 h-11 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(order.id);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1.5" />
                      Деталі
                    </Button>
                  )}
                  {order.status === "scheduled" && (
                    <>
                      <Button
                        size="lg"
                        variant="outline"
                        className="flex-1 h-11 rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Edit functionality
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1.5" />
                        Редагувати
                      </Button>
                      {onDelete && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-11 w-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Видалити це бронювання?")) {
                              onDelete(order.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
