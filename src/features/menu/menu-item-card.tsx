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
        "relative overflow-hidden transition-all duration-300",
        "flex flex-col h-full border-slate-200/80",
        "hover:shadow-lg hover:border-blue-300 hover:-translate-y-1",
        "active:scale-[0.98] active:shadow-md",
        "cursor-pointer group",
        !item.available && "opacity-50 cursor-not-allowed hover:translate-y-0 hover:border-slate-200/80",
        quantity > 0 && "ring-2 ring-blue-500/30 border-blue-400",
        className
      )}
    >
      {/* Unavailable overlay */}
      {!item.available && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center rounded-xl">
          <Badge variant="secondary" className="text-xs font-semibold px-3 py-1.5">
            Недоступно
          </Badge>
        </div>
      )}

      {/* Item image */}
      <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
        {item.imageUrl ? (
          <>
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
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
            <div className="image-fallback absolute inset-0 hidden items-center justify-center">
              <span className="text-5xl opacity-40" aria-hidden="true">
                {item.categoryId === "cat-5"
                  ? "☕"
                  : item.categoryId === "cat-6"
                    ? "🍰"
                    : "🍽️"}
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-40" aria-hidden="true">
              {item.categoryId === "cat-5"
                ? "☕"
                : item.categoryId === "cat-6"
                  ? "🍰"
                  : "🍽️"}
            </span>
          </div>
        )}
        
        {/* Quantity badge overlay */}
        {quantity > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-blue-600 text-white font-semibold text-xs px-2 py-1 shadow-lg">
              {quantity}
            </Badge>
          </div>
        )}
      </div>

      {/* Content section - Compact layout */}
      <div className="flex flex-col flex-1 p-2.5 sm:p-3">
        {/* Name - Compact, single line */}
        <h3 className="font-semibold text-sm sm:text-[15px] leading-tight mb-1 text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {item.name}
        </h3>
        
        {/* Description - Compact, single line */}
        <p className="text-xs text-slate-500 leading-snug mb-2 line-clamp-1">
          {item.description || 'Delicious beef lasagna with double chilli Delicious beef'}
        </p>

        {/* Price and Weight - Compact row */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <span className="font-mono font-bold text-base sm:text-lg text-slate-900 tracking-tight">
            {formatPrice(item.price)}
          </span>
          {item.weight && (
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              {item.weight}г
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
