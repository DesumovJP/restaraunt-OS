"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  Package,
  Clock,
  Edit,
  DollarSign,
  AlertCircle,
  Utensils,
  Timer,
  Layers,
  MoreHorizontal,
} from "lucide-react";
import type { Recipe } from "@/types";

// ==========================================
// HELPERS
// ==========================================

function getMarginColor(foodCostPercent: number): string {
  if (foodCostPercent <= 0) return "border-l-gray-300";
  if (foodCostPercent < 25) return "border-l-green-500";
  if (foodCostPercent < 30) return "border-l-emerald-400";
  if (foodCostPercent < 35) return "border-l-amber-400";
  if (foodCostPercent < 40) return "border-l-orange-500";
  return "border-l-red-500";
}

function getMarginTextColor(foodCostPercent: number): string {
  if (foodCostPercent <= 0) return "text-muted-foreground";
  if (foodCostPercent < 30) return "text-green-600";
  if (foodCostPercent < 35) return "text-amber-600";
  return "text-red-600";
}

function getMarginStatus(foodCostPercent: number) {
  if (foodCostPercent <= 0) return { label: "—", color: "text-muted-foreground", bg: "bg-muted" };
  if (foodCostPercent < 25) return { label: "Відмінно", color: "text-green-700", bg: "bg-green-50" };
  if (foodCostPercent < 30) return { label: "Добре", color: "text-emerald-600", bg: "bg-emerald-50" };
  if (foodCostPercent < 35) return { label: "Норма", color: "text-amber-600", bg: "bg-amber-50" };
  if (foodCostPercent < 40) return { label: "Увага", color: "text-orange-600", bg: "bg-orange-50" };
  return { label: "Критично", color: "text-red-600", bg: "bg-red-50" };
}

function fmt(n: number): string {
  return n % 1 === 0 ? n.toString() : n.toFixed(1);
}

// ==========================================
// RECIPE TABLE ROW (Desktop)
// ==========================================

interface ChefRecipeCardProps {
  recipe: Recipe;
  className?: string;
  onEdit?: () => void;
  onReserve?: (recipeId: string, portions: number) => void;
  onViewDetails?: (recipe: Recipe) => void;
  outputTypeLabel?: string;
}

export function ChefRecipeCard({
  recipe,
  className,
  onEdit,
  onReserve,
  onViewDetails,
  outputTypeLabel,
}: ChefRecipeCardProps) {
  // Calculations
  const maxPortions = React.useMemo(() => {
    if (recipe.ingredients.length === 0) return 0;
    return Math.min(
      ...recipe.ingredients.map((ing) =>
        ing.quantity <= 0 ? Infinity : Math.floor(ing.product.currentStock / ing.quantity)
      )
    );
  }, [recipe.ingredients]);

  const unavailableCount = recipe.ingredients.filter(
    (ing) => ing.product.currentStock < ing.quantity
  ).length;

  const cost = recipe.calculatedCost || recipe.costPerPortion || 0;
  const price = recipe.sellingPrice || recipe.menuItem.price || 0;
  const marginPct = recipe.marginPercent || 0;
  const foodCostPct = recipe.foodCostPercent || 0;
  const marginAbs = recipe.marginAbsolute || (price - cost);
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  const hasIssue = unavailableCount > 0 || foodCostPct >= 40;
  const status = getMarginStatus(foodCostPct);

  return (
    <button
      onClick={() => onViewDetails?.(recipe)}
      className={cn(
        "w-full text-left transition-colors hover:bg-slate-50 active:bg-slate-100",
        hasIssue && "bg-red-50/50 hover:bg-red-50",
        className
      )}
    >
      {/* Mobile Card Layout */}
      <div className="md:hidden p-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          {/* Status indicator */}
          <div className={cn(
            "w-1.5 h-full min-h-[60px] rounded-full flex-shrink-0",
            getMarginColor(foodCostPct).replace("border-l-", "bg-")
          )} />

          <div className="flex-1 min-w-0">
            {/* Title and type */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-slate-900 leading-tight">
                {recipe.menuItem.name}
              </h3>
              {outputTypeLabel && (
                <Badge variant="outline" className="text-[9px] sm:text-[10px] h-5 shrink-0">
                  {outputTypeLabel}
                </Badge>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Собів:</span>
                <span className="font-medium tabular-nums">{fmt(cost)} ₴</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Ціна:</span>
                <span className="font-medium tabular-nums">{fmt(price)} ₴</span>
              </div>
            </div>

            {/* Bottom row with margin and portions */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  status.bg, status.color
                )}>
                  <span>Маржа {Math.round(marginPct)}%</span>
                </div>
                {totalTime > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    {totalTime} хв
                  </span>
                )}
              </div>

              <div className={cn(
                "flex items-center gap-1 text-sm font-bold tabular-nums",
                maxPortions > 10 ? "text-green-600" : maxPortions > 0 ? "text-amber-600" : "text-red-600"
              )}>
                {unavailableCount > 0 && (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                )}
                <span>{maxPortions} порц.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table Row */}
      <div className="hidden md:grid md:grid-cols-[1fr,100px,90px,90px,80px,70px,80px] items-center gap-4 px-4 py-3 border-b border-slate-100">
        {/* Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-1 h-8 rounded-full shrink-0",
            getMarginColor(foodCostPct).replace("border-l-", "bg-")
          )} />
          <div className="min-w-0">
            <span className="font-medium text-slate-900 block truncate">
              {recipe.menuItem.name}
            </span>
            {recipe.ingredients.length > 0 && (
              <span className="text-xs text-slate-500">
                {recipe.ingredients.length} інгредієнтів
              </span>
            )}
          </div>
        </div>

        {/* Output Type */}
        <div>
          {outputTypeLabel && (
            <Badge variant="outline" className="text-xs">
              {outputTypeLabel}
            </Badge>
          )}
        </div>

        {/* Cost */}
        <div className="text-right tabular-nums text-sm text-slate-600">
          {fmt(cost)} ₴
        </div>

        {/* Price */}
        <div className="text-right tabular-nums text-sm font-medium text-slate-900">
          {fmt(price)} ₴
        </div>

        {/* Margin */}
        <div className={cn(
          "text-right tabular-nums text-sm font-semibold",
          status.color
        )}>
          {marginPct > 0 ? `${Math.round(marginPct)}%` : "—"}
        </div>

        {/* Food Cost */}
        <div className={cn(
          "text-right tabular-nums text-sm",
          getMarginTextColor(foodCostPct)
        )}>
          {foodCostPct > 0 ? `${Math.round(foodCostPct)}%` : "—"}
        </div>

        {/* Portions */}
        <div className="text-right">
          {unavailableCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-sm font-bold tabular-nums">!{unavailableCount}</span>
            </span>
          ) : (
            <span className={cn(
              "text-sm font-bold tabular-nums",
              maxPortions > 10 ? "text-green-600" : maxPortions > 0 ? "text-amber-600" : "text-red-600"
            )}>
              {maxPortions}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ==========================================
// RECIPES TABLE HEADER
// ==========================================

export function RecipesTableHeader() {
  return (
    <div className="hidden md:grid md:grid-cols-[1fr,100px,90px,90px,80px,70px,80px] items-center gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider sticky top-0 z-10">
      <div>Назва</div>
      <div>Цех</div>
      <div className="text-right">Собівартість</div>
      <div className="text-right">Ціна</div>
      <div className="text-right">Маржа</div>
      <div className="text-right">FC%</div>
      <div className="text-right">Порцій</div>
    </div>
  );
}

// ==========================================
// RECIPE DETAIL MODAL (Full info on click)
// ==========================================

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onReserve?: (recipeId: string, portions: number) => void;
}

export function RecipeDetailModal({
  recipe,
  open,
  onOpenChange,
  onEdit,
  onReserve,
}: RecipeDetailModalProps) {
  const [reserveCount, setReserveCount] = React.useState(1);

  if (!recipe) return null;

  const cost = recipe.calculatedCost || recipe.costPerPortion || 0;
  const price = recipe.sellingPrice || recipe.menuItem.price || 0;
  const marginPct = recipe.marginPercent || 0;
  const foodCostPct = recipe.foodCostPercent || 0;
  const marginAbs = recipe.marginAbsolute || 0;
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const status = getMarginStatus(foodCostPct);

  const maxPortions = recipe.ingredients.length === 0
    ? 0
    : Math.min(
        ...recipe.ingredients.map((ing) =>
          ing.quantity <= 0 ? Infinity : Math.floor(ing.product.currentStock / ing.quantity)
        )
      );

  const totalIngCost = recipe.ingredients.reduce(
    (sum, ing) => sum + (ing.product.costPerUnit || 0) * ing.quantity,
    0
  );

  const handleReserve = () => {
    onReserve?.(recipe.id, reserveCount);
    setReserveCount(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-0">
        {/* Header */}
        <div className={cn("p-4 border-b", status.bg)}>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg">{recipe.menuItem.name}</DialogTitle>
            <DialogDescription className="flex items-center gap-2 text-xs">
              {recipe.outputType && (
                <Badge variant="outline" className="text-[9px] sm:text-[10px] h-5">
                  {recipe.outputType === "kitchen" && "Кухня"}
                  {recipe.outputType === "bar" && "Бар"}
                  {recipe.outputType === "pastry" && "Кондитерська"}
                  {recipe.outputType === "cold" && "Холодний цех"}
                </Badge>
              )}
              {totalTime > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {totalTime} хв
                </span>
              )}
              <span>{recipe.ingredients.length} інгредієнтів</span>
            </DialogDescription>
          </DialogHeader>

          {/* Economics summary */}
          <div className="grid grid-cols-4 gap-2 mt-3 text-center">
            <div>
              <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">Собів.</div>
              <div className="text-sm font-bold">{fmt(cost)} ₴</div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">Ціна</div>
              <div className="text-sm font-bold">{fmt(price)} ₴</div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">Маржа</div>
              <div className={cn("text-sm font-bold", status.color)}>{fmt(marginAbs)} ₴</div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">Food Cost</div>
              <div className={cn("text-sm font-bold", status.color)}>{fmt(foodCostPct)}%</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Availability */}
          <div className="flex items-center justify-between p-2 rounded bg-muted/50">
            <span className="text-sm">Можливо порцій:</span>
            <span
              className={cn(
                "text-lg font-bold tabular-nums",
                maxPortions > 10 ? "text-green-600" : maxPortions > 0 ? "text-amber-600" : "text-red-600"
              )}
            >
              {maxPortions}
            </span>
          </div>

          {/* Ingredients */}
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase mb-2">
              Інгредієнти
            </div>
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {recipe.ingredients.map((ing, idx) => {
                const hasEnough = ing.product.currentStock >= ing.quantity;
                const ingCost = (ing.product.costPerUnit || 0) * ing.quantity;

                return (
                  <div
                    key={ing.product.id || idx}
                    className={cn(
                      "flex items-center text-xs py-1 px-2 rounded",
                      !hasEnough && "bg-red-50"
                    )}
                  >
                    <span className={cn("flex-1 truncate", !hasEnough && "text-red-700")}>
                      {!hasEnough && <AlertCircle className="h-3 w-3 inline mr-1 text-red-500" />}
                      {ing.product.name}
                    </span>
                    <span className="text-muted-foreground tabular-nums w-16 text-right">
                      {ing.quantity} {ing.unit}
                    </span>
                    <span className="text-muted-foreground tabular-nums w-14 text-right">
                      {fmt(ingCost)} ₴
                    </span>
                    <span
                      className={cn(
                        "tabular-nums w-10 text-right font-medium",
                        hasEnough ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {ing.product.currentStock}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs font-medium pt-2 mt-2 border-t">
              <span>Всього:</span>
              <span className="tabular-nums">{fmt(totalIngCost)} ₴</span>
            </div>
          </div>

          {/* Steps (if any) */}
          {recipe.steps && recipe.steps.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase mb-2">
                Кроки ({recipe.steps.length})
              </div>
              <div className="space-y-2 text-xs">
                {recipe.steps.map((step) => (
                  <div key={step.stepNumber} className="flex gap-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[9px] sm:text-[10px] font-bold">
                      {step.stepNumber}
                    </span>
                    <span className="flex-1 text-muted-foreground">{step.instruction}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reserve section */}
          {maxPortions > 0 && (
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Списати інгредієнти:</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setReserveCount((c) => Math.max(1, c - 1))}
                    disabled={reserveCount <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={maxPortions}
                    value={reserveCount}
                    onChange={(e) =>
                      setReserveCount(Math.min(maxPortions, Math.max(1, parseInt(e.target.value) || 1)))
                    }
                    className="w-12 h-7 text-center text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setReserveCount((c) => Math.min(maxPortions, c + 1))}
                    disabled={reserveCount >= maxPortions}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Вартість: <span className="font-medium">{fmt(cost * reserveCount)} ₴</span>
              </div>
              <Button size="sm" className="w-full h-8" onClick={handleReserve}>
                <Package className="h-3.5 w-3.5 mr-1.5" />
                Списати {reserveCount} порц.
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t bg-muted/30">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenChange(false)}>
            Закрити
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Редагувати
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
