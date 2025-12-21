"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";
import { Clock } from "lucide-react";

interface CookingPlanItem {
  time: string; // HH:mm format
  items: Array<{
    name: string;
    quantity: number;
    station?: string;
  }>;
}

interface CookingPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
}

// Mock data - в реальному додатку це буде приходити з API
const generateMockPlan = (date: Date): CookingPlanItem[] => {
  return [
    {
      time: "10:00",
      items: [
        { name: "Салат Цезар", quantity: 5, station: "Salad Bar" },
        { name: "Борщ український", quantity: 3, station: "Fry Station" },
      ],
    },
    {
      time: "11:00",
      items: [
        { name: "Стейк Рібай", quantity: 2, station: "Grill" },
        { name: "Лосось на грилі", quantity: 4, station: "Grill" },
        { name: "Грецький салат", quantity: 6, station: "Salad Bar" },
      ],
    },
    {
      time: "12:00",
      items: [
        { name: "Курка Київська", quantity: 8, station: "Fry Station" },
        { name: "Картопля фрі", quantity: 10, station: "Fry Station" },
        { name: "Тірамісу", quantity: 4, station: "Dessert" },
      ],
    },
    {
      time: "13:00",
      items: [
        { name: "Стейк Рібай", quantity: 6, station: "Grill" },
        { name: "Салат Цезар", quantity: 8, station: "Salad Bar" },
      ],
    },
    {
      time: "14:00",
      items: [
        { name: "Лосось на грилі", quantity: 3, station: "Grill" },
        { name: "Чізкейк", quantity: 5, station: "Dessert" },
      ],
    },
  ];
};

export function CookingPlanModal({
  open,
  onOpenChange,
  selectedDate,
}: CookingPlanModalProps) {
  const plan = React.useMemo(() => generateMockPlan(selectedDate), [selectedDate]);

  const formattedDate = React.useMemo(() => {
    return new Intl.DateTimeFormat("uk-UA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(selectedDate);
  }, [selectedDate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>План приготування</DialogTitle>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {plan.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Немає запланованих страв на цей день
            </div>
          ) : (
            plan.map((planItem, index) => (
              <div
                key={index}
                className="border border-border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-base">{planItem.time}</span>
                </div>
                <div className="space-y-1.5 pl-6">
                  {planItem.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {item.name}
                        </span>
                        {item.station && (
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0.5"
                          >
                            {item.station}
                          </Badge>
                        )}
                      </div>
                      <span className="font-semibold text-primary min-w-[2rem] text-right">
                        {item.quantity}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}










