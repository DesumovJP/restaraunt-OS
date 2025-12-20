"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatPrice } from "@/lib/utils";
import {
  ChefHat,
  Calculator,
  Minus,
  Plus,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import type { Recipe } from "@/types";

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
}

export function RecipeCard({ recipe, className }: RecipeCardProps) {
  const [portions, setPortions] = React.useState(1);

  // Calculate total cost for selected portions
  const totalCost = recipe.costPerPortion * portions;

  // Calculate margin (assuming menu price is in recipe.menuItem.price)
  const menuPrice = recipe.menuItem.price * portions;
  const margin = menuPrice - totalCost;
  const marginPercent = ((margin / menuPrice) * 100).toFixed(0);

  // Check ingredient availability
  const ingredientStatus = recipe.ingredients.map((ing) => {
    const required = ing.quantity * portions;
    const available = ing.product.currentStock;
    return {
      ...ing,
      required,
      available,
      isAvailable: available >= required,
      shortage: Math.max(0, required - available),
    };
  });

  const allIngredientsAvailable = ingredientStatus.every((i) => i.isAvailable);

  // Portion controls
  const incrementPortions = () => setPortions((p) => Math.min(p + 1, 100));
  const decrementPortions = () => setPortions((p) => Math.max(p - 1, 1));

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              {recipe.menuItem.name}
            </CardTitle>
            <CardDescription>{recipe.menuItem.description}</CardDescription>
          </div>
          <Badge variant={allIngredientsAvailable ? "success" : "warning"}>
            {allIngredientsAvailable ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Доступно
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                Не вистачає
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Portion selector */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Порцій:</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={decrementPortions}
              disabled={portions <= 1}
              aria-label="Зменшити порції"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min={1}
              max={100}
              value={portions}
              onChange={(e) => setPortions(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 h-8 text-center"
              aria-label="Кількість порцій"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={incrementPortions}
              aria-label="Збільшити порції"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Ingredients list */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Інгредієнти:</h4>
          <div className="space-y-2">
            {ingredientStatus.map((ing) => (
              <div
                key={ing.productId}
                className={cn(
                  "flex items-center justify-between p-2 rounded border text-sm",
                  ing.isAvailable
                    ? "bg-success-light border-success/30"
                    : "bg-danger-light border-danger/30"
                )}
              >
                <span className="font-medium">{ing.product.name}</span>
                <div className="text-right">
                  <span
                    className={cn(
                      "font-mono",
                      !ing.isAvailable && "text-danger"
                    )}
                  >
                    {ing.required.toFixed(2)} {ing.unit}
                  </span>
                  <span className="text-muted-foreground text-xs block">
                    доступно: {ing.available.toFixed(2)} {ing.product.unit}
                  </span>
                  {!ing.isAvailable && (
                    <span className="text-danger text-xs">
                      не вистачає: {ing.shortage.toFixed(2)} {ing.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost calculation */}
        <div className="p-3 bg-primary-light rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Калькуляція:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Собівартість:</span>
              <span className="font-semibold block">{formatPrice(totalCost)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Ціна меню:</span>
              <span className="font-semibold block">{formatPrice(menuPrice)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Маржа:</span>
              <span className="font-semibold text-success block">
                {formatPrice(margin)} ({marginPercent}%)
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">На порцію:</span>
              <span className="font-semibold block">
                {formatPrice(recipe.costPerPortion)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <Button className="w-full" disabled={!allIngredientsAvailable}>
          {allIngredientsAvailable
            ? "Списати інгредієнти"
            : "Не вистачає інгредієнтів"}
        </Button>
      </CardFooter>
    </Card>
  );
}
