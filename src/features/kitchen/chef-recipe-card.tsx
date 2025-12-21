"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  Minus,
  Plus,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  ChevronDown,
  Package,
  Clock,
  Edit,
} from "lucide-react";
import type { Recipe } from "@/types";

interface ChefRecipeCardProps {
  recipe: Recipe;
  className?: string;
  onEdit?: () => void;
  onReserve?: (recipeId: string, portions: number) => void;
  outputTypeLabel?: string;
  servingCourseLabel?: string;
}

export function ChefRecipeCard({
  recipe,
  className,
  onEdit,
  onReserve,
  outputTypeLabel,
}: ChefRecipeCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = React.useState(false);
  const [reservePortions, setReservePortions] = React.useState(1);

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

  const handleReserve = () => {
    onReserve?.(recipe.id, reservePortions);
    setIsReserveModalOpen(false);
    setReservePortions(1);
  };

  return (
    <>
      <Card
        className={cn(
          "group overflow-hidden transition-all hover:shadow-md cursor-pointer",
          className
        )}
        onClick={() => setIsExpanded(!isExpanded)}
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {outputTypeLabel && (
                  <span className="truncate">{outputTypeLabel}</span>
                )}
                <span className="text-muted-foreground/50">•</span>
                <span>{recipe.ingredients.length} інгр.</span>
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
          <div className="flex items-center justify-center mt-2">
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground/50 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </div>
        </div>

        {/* Expandable section */}
        {isExpanded && (
          <div
            className="border-t bg-muted/30 p-3 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ingredients compact list */}
            <div className="space-y-1">
              {recipe.ingredients.slice(0, 4).map((ing) => {
                const hasEnough = ing.product.currentStock >= ing.quantity;
                return (
                  <div
                    key={ing.productId}
                    className="flex items-center justify-between text-xs"
                  >
                    <span
                      className={cn(
                        "truncate",
                        !hasEnough && "text-red-600"
                      )}
                    >
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

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
              >
                <Edit className="h-3 w-3 mr-1" />
                Редаг.
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs"
                disabled={maxPortions === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsReserveModalOpen(true);
                }}
              >
                <Package className="h-3 w-3 mr-1" />
                Списати
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Reserve Modal */}
      <Dialog open={isReserveModalOpen} onOpenChange={setIsReserveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-orange-600" />
              {recipe.menuItem.name}
            </DialogTitle>
            <DialogDescription>
              Максимально доступно: {maxPortions} порцій
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Кількість порцій:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setReservePortions((p) => Math.max(1, p - 1))}
                  disabled={reservePortions <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={maxPortions}
                  value={reservePortions}
                  onChange={(e) =>
                    setReservePortions(
                      Math.min(maxPortions, Math.max(1, parseInt(e.target.value) || 1))
                    )
                  }
                  className="w-16 h-8 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setReservePortions((p) => Math.min(maxPortions, p + 1))}
                  disabled={reservePortions >= maxPortions}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg max-h-40 overflow-y-auto">
              <div className="space-y-1.5 text-sm">
                {recipe.ingredients.map((ing) => (
                  <div key={ing.productId} className="flex justify-between">
                    <span className="text-muted-foreground truncate">
                      {ing.product.name}
                    </span>
                    <span className="font-mono tabular-nums ml-2 shrink-0">
                      {(ing.quantity * reservePortions).toFixed(1)} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Резервування діє 24 години
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReserveModalOpen(false)}
            >
              Скасувати
            </Button>
            <Button onClick={handleReserve}>Списати інгредієнти</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
