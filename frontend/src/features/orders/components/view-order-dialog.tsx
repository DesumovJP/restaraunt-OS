"use client";

/**
 * View Order Dialog
 *
 * Displays detailed information about a planned order/reservation.
 */

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FileText,
  MapPin,
  Users,
  Utensils,
  User,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import {
  type PlannedOrder,
  EVENT_TYPES,
  SEATING_AREAS,
  MENU_PRESETS,
  PAYMENT_STATUSES,
  formatDateFull,
} from "../planned-orders-config";

interface ViewOrderDialogProps {
  order: PlannedOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewOrderDialog({ order, open, onOpenChange }: ViewOrderDialogProps) {
  if (!order) return null;

  const eventConfig = order.eventType ? EVENT_TYPES[order.eventType] : null;
  const EventIcon = eventConfig?.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Деталі бронювання
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event info */}
          <div className="flex items-center gap-3">
            {eventConfig && EventIcon && (
              <>
                <EventIcon className={cn("h-8 w-8", eventConfig.color)} />
                <div>
                  <h3 className="font-semibold">
                    {order.eventName || eventConfig.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDateFull(order.scheduledTime)} о{" "}
                    {order.scheduledTime.toLocaleTimeString("uk-UA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Столик {order.tableNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{order.guestCount} гостей</span>
            </div>
            {order.seatingArea && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{SEATING_AREAS[order.seatingArea]}</span>
              </div>
            )}
            {order.menuPreset && (
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-muted-foreground" />
                <span>{MENU_PRESETS[order.menuPreset]}</span>
              </div>
            )}
          </div>

          {/* Contact */}
          {order.contact && (
            <div className="p-3 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2 text-sm">Контактна особа</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{order.contact.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${order.contact.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {order.contact.phone}
                  </a>
                </div>
                {order.contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${order.contact.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {order.contact.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment */}
          {order.paymentStatus && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Статус оплати</span>
              </div>
              <Badge className={PAYMENT_STATUSES[order.paymentStatus].color}>
                {PAYMENT_STATUSES[order.paymentStatus].label}
              </Badge>
            </div>
          )}

          {/* Notes */}
          {order.specialRequests && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{order.specialRequests}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
