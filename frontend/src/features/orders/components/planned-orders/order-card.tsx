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

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        timeDisplay.isOverdue &&
          order.status === "scheduled" &&
          "border-red-300 bg-red-50/50",
        order.eventType &&
          order.eventType !== "regular" &&
          "border-l-4 border-l-purple-400"
      )}
    >
      {/* Main row */}
      <div
        className="p-3 cursor-pointer hover:bg-muted/30"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          {/* Expand indicator */}
          <div className="shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {/* Table/Event icon */}
          <div
            className={cn(
              "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white",
              order.eventType && order.eventType !== "regular"
                ? "bg-gradient-to-br from-purple-500 to-purple-600"
                : variant === "kitchen"
                  ? "bg-orange-600"
                  : "bg-blue-600"
            )}
          >
            {order.eventType && order.eventType !== "regular" ? (
              <EventIcon className="h-5 w-5" />
            ) : (
              order.tableNumber
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-semibold text-sm">
                {order.eventName || `Столик ${order.tableNumber}`}
              </span>
              {order.eventType && order.eventType !== "regular" && (
                <Badge
                  variant="outline"
                  className={cn("text-xs px-1.5", eventConfig?.color)}
                >
                  {eventConfig?.label}
                </Badge>
              )}
              {order.paymentStatus && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs px-1.5",
                    PAYMENT_STATUSES[order.paymentStatus].color
                  )}
                >
                  {PAYMENT_STATUSES[order.paymentStatus].label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {order.guestCount}
                {order.childrenCount ? ` (${order.childrenCount} діт.)` : ""}
              </span>
              {order.seatingArea && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {SEATING_AREAS[order.seatingArea]}
                </span>
              )}
              {order.contact && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {order.contact.name}
                </span>
              )}
              {order.items.length > 0 && (
                <span className="flex items-center gap-1">
                  <UtensilsCrossed className="h-3 w-3" />
                  {order.items.length} страв
                </span>
              )}
            </div>
          </div>

          {/* Time */}
          <div className="shrink-0 text-right">
            <div
              className={cn(
                "text-sm font-bold tabular-nums",
                timeDisplay.isOverdue ? "text-red-600" : "text-foreground"
              )}
            >
              {timeDisplay.time}
            </div>
            <div
              className={cn(
                "text-xs",
                timeDisplay.isOverdue ? "text-red-500" : "text-muted-foreground"
              )}
            >
              {timeDisplay.relative}
            </div>
          </div>

          {/* Status */}
          <div className="shrink-0">{getStatusBadge(order.status)}</div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t bg-muted/30 p-3 space-y-3">
          {/* Contact info */}
          {order.contact && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.contact.name}</span>
              </div>
              <a
                href={`tel:${order.contact.phone}`}
                className="flex items-center gap-1.5 text-blue-600 hover:underline"
              >
                <Phone className="h-4 w-4" />
                {order.contact.phone}
              </a>
              {order.contact.email && (
                <a
                  href={`mailto:${order.contact.email}`}
                  className="flex items-center gap-1.5 text-blue-600 hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {order.contact.email}
                </a>
              )}
            </div>
          )}

          {/* Special requests */}
          {order.specialRequests && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="text-amber-800">{order.specialRequests}</span>
            </div>
          )}

          {/* Cake/Decorations */}
          {(order.cakeDetails || order.decorations) && (
            <div className="flex gap-3 text-sm">
              {order.cakeDetails && (
                <div className="flex items-center gap-1.5 text-pink-600">
                  <Cake className="h-4 w-4" />
                  <span>{order.cakeDetails}</span>
                </div>
              )}
              {order.decorations && (
                <div className="flex items-center gap-1.5 text-purple-600">
                  <PartyPopper className="h-4 w-4" />
                  <span>{order.decorations}</span>
                </div>
              )}
            </div>
          )}

          {/* Deposit info */}
          {order.depositAmount && (
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-green-600" />
              <span>
                Завдаток: <strong>{order.depositAmount} грн</strong>
              </span>
            </div>
          )}

          {/* Items list */}
          {order.items.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground uppercase">
                Меню
              </div>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.quantity}x</span>
                    <span>{item.menuItemName}</span>
                  </div>
                  {variant === "kitchen" && item.station && (
                    <Badge variant="outline" className="text-xs">
                      {item.station}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {variant === "kitchen" ? (
              <>
                {order.status === "scheduled" && onActivate && (
                  <Button
                    size="sm"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onActivate(order.id);
                    }}
                  >
                    <Play className="h-4 w-4 mr-1.5" />
                    Активувати зараз
                  </Button>
                )}
                {order.status === "activated" && onComplete && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
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
                    size="sm"
                    variant="outline"
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
                      size="sm"
                      variant="outline"
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
                        size="sm"
                        variant="destructive"
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
      )}
    </Card>
  );
}
