"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, X, Phone } from "lucide-react";
import { useScheduledOrderModeStore } from "@/stores/scheduled-order-mode-store";
import { cn } from "@/lib/utils";

export function ScheduledModeBanner() {
  const router = useRouter();
  const {
    isScheduledMode,
    tableNumber,
    scheduledFor,
    contactName,
    guestCount,
    exitScheduledMode,
    getFormattedDateTime,
  } = useScheduledOrderModeStore();

  if (!isScheduledMode) return null;

  const handleCancel = () => {
    exitScheduledMode();
    router.push("/pos/waiter/calendar");
  };

  const formattedDateTime = getFormattedDateTime();

  return (
    <div className="bg-purple-600 text-white px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="font-medium">Попереднє замовлення</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-purple-100">
          {/* Date & Time */}
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formattedDateTime}</span>
          </div>

          {/* Table */}
          {tableNumber && (
            <div className="flex items-center gap-1">
              <span className="px-2 py-0.5 bg-purple-500 rounded-md text-xs font-medium">
                Стіл {tableNumber}
              </span>
            </div>
          )}

          {/* Guest count */}
          {guestCount && (
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{guestCount} гостей</span>
            </div>
          )}

          {/* Contact name */}
          {contactName && (
            <div className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              <span>{contactName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cancel button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        className="text-white hover:bg-purple-500 hover:text-white h-8"
      >
        <X className="h-4 w-4 mr-1" />
        Скасувати
      </Button>
    </div>
  );
}
