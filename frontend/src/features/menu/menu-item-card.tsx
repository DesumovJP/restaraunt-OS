"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import Image from "next/image";
import type { MenuItem, Category } from "@/types";

interface MenuItemCardProps {
  item: MenuItem;
  category?: Category;
  onAdd: (item: MenuItem) => void;
  quantity?: number;
  className?: string;
}

export function MenuItemCard({
  item,
  category,
  onAdd,
  quantity = 0,
  className,
}: MenuItemCardProps) {
  const handleCardClick = () => {
    if (item.available) {
      onAdd(item);
    }
  };

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        "relative overflow-hidden",
        "flex flex-col h-full border-slate-200",
        "transition-colors duration-150",
        "active:bg-slate-50",
        "cursor-pointer",
        !item.available && "opacity-50 cursor-not-allowed",
        quantity > 0 && "ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/30",
        className
      )}
    >
      {/* Unavailable overlay */}
      {!item.available && (
        <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
          <Badge variant="secondary" className="text-xs font-medium">
            Недоступно
          </Badge>
        </div>
      )}

      {/* Item image - без анімацій */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
        {item.imageUrl ? (
          <>
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.parentElement?.querySelector('.image-fallback');
                if (fallback) {
                  (fallback as HTMLElement).style.display = 'flex';
                }
              }}
            />
            <div className="image-fallback absolute inset-0 hidden items-center justify-center bg-slate-100">
              <span className="text-4xl opacity-30" aria-hidden="true">🍽️</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-30" aria-hidden="true">🍽️</span>
          </div>
        )}

        {/* Quantity badge */}
        {quantity > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-emerald-600 text-white font-bold text-sm min-w-[28px] h-7 flex items-center justify-center">
              {quantity}
            </Badge>
          </div>
        )}
      </div>

      {/* Content - спрощений */}
      <div className="flex flex-col flex-1 p-3">
        <h3 className="font-semibold text-sm text-slate-900 line-clamp-1 mb-1">
          {item.name}
        </h3>

        {item.description && (
          <p className="text-xs text-slate-500 line-clamp-1 mb-2">
            {item.description}
          </p>
        )}

        {/* Price and Weight/Volume */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <span className="font-bold text-base text-slate-900">
            {formatPrice(item.price)}
          </span>
          {item.weight && (
            <span className="text-xs text-slate-400">
              {item.weight}{item.outputType === 'bar' ? 'мл' : 'г'}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
