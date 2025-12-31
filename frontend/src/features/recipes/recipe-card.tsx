"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChefHat, AlertTriangle, CheckCircle, ChevronDown } from "lucide-react";
import type { Recipe } from "@/types";

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
  onClick?: () => void;
}

export function RecipeCard({ recipe, className, onClick }: RecipeCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Calculate max portions available
  const maxPortions = React.useMemo(() => {
    if (recipe.ingredients.length === 0) return 0;
    const portionsPerIngredient = recipe.ingredients.map((ing) => {
      if (ing.quantity <= 0) return Infinity;
      return Math.floor(ing.product.currentStock / ing.quantity);
    });
    return Math.min(...portionsPerIngredient);
  }, [recipe.ingredients]);

  // Check ingredient availability
  const unavailableCount = recipe.ingredients.filter((ing) => {
    return ing.product.currentStock < ing.quantity;
  }).length;

  const allIngredientsAvailable = unavailableCount === 0;

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all hover:shadow-md cursor-pointer",
        className
      )}
      onClick={() => {
        if (onClick) {
          onClick();
        } else {
          setIsExpanded(!isExpanded);
        }
      }}
    >
      {/* Compact Header */}
      <div className="p-3">
        <div className="flex items-start gap-2">
          {/* Icon + Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <ChefHat className="h-4 w-4 text-orange-600 shrink-0" />
              <h3 className="font-semibold text-sm truncate leading-tight">
                {recipe.menuItem.name}
              </h3>
            </div>
            {/* Meta row */}
            <div className="text-xs text-muted-foreground">
              {recipe.ingredients.length} інгредієнтів
            </div>
          </div>

          {/* Status badge */}
          <Badge
            variant={allIngredientsAvailable ? "success" : "warning"}
            className="shrink-0 h-5 text-xs px-1.5"
          >
            {allIngredientsAvailable ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
          </Badge>
        </div>

        {/* Key metric */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">Можливо:</span>
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              maxPortions > 10
                ? "text-green-600"
                : maxPortions > 0
                ? "text-amber-600"
                : "text-red-600"
            )}
          >
            {maxPortions} порц.
          </span>
        </div>

        {/* Expand indicator */}
        {!onClick && (
          <div className="flex items-center justify-center mt-2">
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground/50 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </div>
        )}
      </div>

      {/* Expandable section */}
      {isExpanded && !onClick && (
        <div
          className="border-t bg-muted/30 p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-1">
            {recipe.ingredients.slice(0, 4).map((ing) => {
              const hasEnough = ing.product.currentStock >= ing.quantity;
              return (
                <div
                  key={ing.productId}
                  className="flex items-center justify-between text-xs"
                >
                  <span className={cn("truncate", !hasEnough && "text-red-600")}>
                    {ing.product.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground ml-2 shrink-0">
                    {ing.quantity} {ing.unit}
                  </span>
                </div>
              );
            })}
            {recipe.ingredients.length > 4 && (
              <div className="text-xs text-muted-foreground">
                +{recipe.ingredients.length - 4} ще...
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
