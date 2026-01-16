"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Sparkles, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeliveryOrderItem } from "@/types/delivery";

interface DeliveryItemRowProps {
  item: DeliveryOrderItem;
  onUpdate: (item: DeliveryOrderItem) => void;
  onRemove: (id: string) => void;
}

const UNIT_LABELS: Record<string, string> = {
  kg: "кг",
  g: "г",
  l: "л",
  ml: "мл",
  pcs: "шт",
  portion: "порц",
};

export function DeliveryItemRow({ item, onUpdate, onRemove }: DeliveryItemRowProps) {
  const handleQuantityChange = (value: string) => {
    const quantity = parseFloat(value) || 0;
    onUpdate({ ...item, quantity });
  };

  const adjustQuantity = (delta: number) => {
    const step = item.unit === "pcs" ? 1 : 0.5;
    const newQuantity = Math.max(0, (item.quantity || 0) + delta * step);
    onUpdate({ ...item, quantity: newQuantity });
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 hover:bg-slate-50/50 transition-colors border-b last:border-b-0">
      {/* Product Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{item.nameUk || item.name}</span>
          {item.isNew && (
            <Badge variant="secondary" className="gap-1 text-xs bg-amber-100 text-amber-700 border-amber-200">
              <Sparkles className="h-3 w-3" />
              Новий
            </Badge>
          )}
        </div>
        {item.sku && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.sku}</p>
        )}
      </div>

      {/* Unit */}
      <div className="w-12 text-center shrink-0">
        <span className="text-sm text-muted-foreground">
          {UNIT_LABELS[item.unit] || item.unit}
        </span>
      </div>

      {/* Quantity with +/- buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="icon"
          onClick={() => adjustQuantity(-1)}
          className="h-8 w-8 rounded-lg"
          disabled={!item.quantity || item.quantity <= 0}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.quantity || ""}
          onChange={(e) => handleQuantityChange(e.target.value)}
          placeholder="0"
          className="h-8 w-20 text-center text-sm"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => adjustQuantity(1)}
          className="h-8 w-8 rounded-lg"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(item.id)}
        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * Mobile-friendly version of the item row
 */
export function DeliveryItemRowMobile({ item, onUpdate, onRemove }: DeliveryItemRowProps) {
  const handleQuantityChange = (value: string) => {
    const quantity = parseFloat(value) || 0;
    onUpdate({ ...item, quantity });
  };

  const adjustQuantity = (delta: number) => {
    const step = item.unit === "pcs" ? 1 : 0.5;
    const newQuantity = Math.max(0, (item.quantity || 0) + delta * step);
    onUpdate({ ...item, quantity: newQuantity });
  };

  return (
    <div className="p-4 border-b last:border-b-0 space-y-3">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{item.nameUk || item.name}</span>
            {item.isNew && (
              <Badge variant="secondary" className="gap-1 text-xs bg-amber-100 text-amber-700 border-amber-200">
                <Sparkles className="h-3 w-3" />
                Новий
              </Badge>
            )}
          </div>
          {item.sku && (
            <p className="text-xs text-muted-foreground mt-0.5">{item.sku}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Quantity Input with +/- */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Кількість</label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustQuantity(-1)}
            className="h-11 w-11 rounded-xl"
            disabled={!item.quantity || item.quantity <= 0}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.quantity || ""}
            onChange={(e) => handleQuantityChange(e.target.value)}
            placeholder="0"
            className="h-11 text-center flex-1 text-lg font-medium"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustQuantity(1)}
            className="h-11 w-11 rounded-xl"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-10 text-center">
            {UNIT_LABELS[item.unit] || item.unit}
          </span>
        </div>
      </div>
    </div>
  );
}
