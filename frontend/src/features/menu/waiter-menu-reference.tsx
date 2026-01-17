"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { useRecipes } from "@/hooks/use-menu";
import { cn } from "@/lib/utils";
import {
  Search,
  X,
  Loader2,
  Menu,
  Clock,
  Users,
  AlertTriangle,
  ChefHat,
  UtensilsCrossed,
  Wine,
  Cake,
  Snowflake,
  Leaf,
  Info,
  BookOpen,
} from "lucide-react";
import type { Recipe, OutputType } from "@/types";

const OUTPUT_TYPE_OPTIONS: { value: OutputType | "all"; label: string; icon: typeof ChefHat }[] = [
  { value: "all", label: "Всі", icon: UtensilsCrossed },
  { value: "kitchen", label: "Кухня", icon: ChefHat },
  { value: "bar", label: "Бар", icon: Wine },
  { value: "pastry", label: "Десерти", icon: Cake },
  { value: "cold", label: "Холодні", icon: Snowflake },
];

const OUTPUT_TYPE_LABELS: Record<OutputType, string> = {
  kitchen: "Кухня",
  bar: "Бар",
  pastry: "Десерти",
  cold: "Холодні страви",
};

interface WaiterMenuReferenceProps {
  onOpenSidebar?: () => void;
}

export function WaiterMenuReference({ onOpenSidebar }: WaiterMenuReferenceProps) {
  const { recipes, isLoading } = useRecipes();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedOutputType, setSelectedOutputType] = React.useState<OutputType | "all">("all");
  const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  // Filter recipes
  const filteredRecipes = React.useMemo(() => {
    let result = recipes;

    if (selectedOutputType !== "all") {
      result = result.filter((r) => r.outputType === selectedOutputType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.menuItem.name.toLowerCase().includes(query) ||
          r.menuItem.description?.toLowerCase().includes(query) ||
          r.ingredients.some((ing) => ing.product.name.toLowerCase().includes(query))
      );
    }

    return result;
  }, [recipes, selectedOutputType, searchQuery]);

  // Group by output type for stats
  const recipesByType = React.useMemo(() => {
    const counts: Record<OutputType | "all", number> = {
      all: recipes.length,
      kitchen: 0,
      bar: 0,
      pastry: 0,
      cold: 0,
    };
    recipes.forEach((r) => {
      if (r.outputType) {
        counts[r.outputType]++;
      }
    });
    return counts;
  }, [recipes]);

  // Check for common allergens in ingredients
  const getAllergenWarnings = (recipe: Recipe): string[] => {
    const warnings: string[] = [];
    const allergenKeywords = {
      "Глютен": ["пшениця", "борошно", "хліб", "макарони", "паста"],
      "Молочні": ["молоко", "сир", "вершки", "масло", "йогурт"],
      "Горіхи": ["горіх", "мигдаль", "фундук", "арахіс", "кешю"],
      "Морепродукти": ["креветки", "мідії", "риба", "лосось", "тунець"],
      "Яйця": ["яйце", "яєчний"],
    };

    recipe.ingredients.forEach((ing) => {
      const name = ing.product.name.toLowerCase();
      Object.entries(allergenKeywords).forEach(([allergen, keywords]) => {
        if (keywords.some((kw) => name.includes(kw)) && !warnings.includes(allergen)) {
          warnings.push(allergen);
        }
      });
    });

    return warnings;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className={cn(
        "sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b transition-shadow duration-200",
        isSearchFocused && "shadow-md"
      )}>
        <div className="px-3 sm:px-4 pt-3 pb-2 safe-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onOpenSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-9 w-9"
                  onClick={onOpenSidebar}
                  aria-label="Меню"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold leading-tight">Довідник страв</h1>
                  <p className="text-xs text-muted-foreground">
                    {recipes.length} страв у меню
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-3 sm:px-4 pb-2">
          <div className={cn(
            "relative transition-all duration-200",
            isSearchFocused && "scale-[1.01]"
          )}>
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
              isSearchFocused ? "text-slate-700" : "text-muted-foreground"
            )} />
            <Input
              type="search"
              placeholder="Пошук страви або інгредієнта..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={cn(
                "pl-9 pr-9 h-10 sm:h-11 rounded-xl border-slate-200 bg-slate-50/80",
                "text-sm placeholder:text-slate-400",
                "focus:bg-white focus:border-slate-400 focus:ring-slate-200",
                "transition-all duration-200"
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Category filter */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 px-3 sm:px-4 pb-3 min-w-max">
            {OUTPUT_TYPE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = selectedOutputType === option.value;
              const count = recipesByType[option.value];

              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedOutputType(option.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium",
                    "transition-all duration-200 touch-feedback active:scale-[0.97]",
                    "whitespace-nowrap",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{option.label}</span>
                  <Badge
                    variant={isActive ? "secondary" : "outline"}
                    className={cn(
                      "h-5 px-1.5 text-[10px] sm:text-xs font-semibold",
                      isActive && "bg-white/20 text-white border-0"
                    )}
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-smooth p-3 sm:p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Loader2 className="h-7 w-7 text-slate-500 animate-spin" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Завантаження...</p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
              {searchQuery ? "Нічого не знайдено" : "Немає страв"}
            </h3>
            <p className="text-sm text-slate-500 text-center max-w-xs">
              {searchQuery
                ? "Спробуйте інший пошуковий запит"
                : "Страви ще не додані до меню"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRecipes.map((recipe) => {
              const allergens = getAllergenWarnings(recipe);

              return (
                <Card
                  key={recipe.id}
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99] touch-feedback"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <CardContent className="p-4">
                    {/* Header with name and type */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {recipe.menuItem.name}
                        </h3>
                        {recipe.outputType && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {OUTPUT_TYPE_LABELS[recipe.outputType]}
                          </Badge>
                        )}
                      </div>
                      <span className="text-lg font-bold text-slate-900 whitespace-nowrap">
                        {recipe.menuItem.price}
                      </span>
                    </div>

                    {/* Description */}
                    {recipe.menuItem.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {recipe.menuItem.description}
                      </p>
                    )}

                    {/* Quick info */}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {recipe.prepTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {recipe.prepTime} хв
                        </span>
                      )}
                      {recipe.portionYield && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {recipe.portionYield}г
                        </span>
                      )}
                    </div>

                    {/* Allergen warnings */}
                    {allergens.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        <span className="text-xs text-amber-700 truncate">
                          {allergens.join(", ")}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="h-4 safe-bottom" />
      </div>

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={(open) => !open && setSelectedRecipe(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedRecipe?.menuItem.name}</DialogTitle>
          </DialogHeader>
          <DialogBody className="overflow-y-auto flex-1">
            {selectedRecipe && (
              <div className="space-y-4">
                {/* Price and type */}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{selectedRecipe.menuItem.price} </span>
                  {selectedRecipe.outputType && (
                    <Badge variant="secondary">
                      {OUTPUT_TYPE_LABELS[selectedRecipe.outputType]}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {selectedRecipe.menuItem.description && (
                  <p className="text-slate-600">{selectedRecipe.menuItem.description}</p>
                )}

                {/* Quick info */}
                <div className="flex flex-wrap gap-3">
                  {selectedRecipe.prepTime && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                      <Clock className="h-4 w-4 text-slate-600" />
                      <span className="text-sm font-medium">{selectedRecipe.prepTime} хв</span>
                    </div>
                  )}
                  {selectedRecipe.portionYield && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                      <Users className="h-4 w-4 text-slate-600" />
                      <span className="text-sm font-medium">{selectedRecipe.portionYield}г порція</span>
                    </div>
                  )}
                </div>

                {/* Allergens */}
                {getAllergenWarnings(selectedRecipe).length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="font-semibold text-amber-800 text-sm">Можливі алергени</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {getAllergenWarnings(selectedRecipe).map((allergen) => (
                        <Badge key={allergen} variant="outline" className="bg-amber-100 border-amber-300 text-amber-800">
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ingredients */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-600" />
                    Склад страви
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <ul className="space-y-1.5">
                      {selectedRecipe.ingredients.map((ing, idx) => (
                        <li key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">{ing.product.name}</span>
                          <span className="text-slate-500">
                            {ing.quantity} {ing.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Preparation instructions if any */}
                {selectedRecipe.instructions && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      Примітки
                    </h4>
                    <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-xl">
                      {selectedRecipe.instructions}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
