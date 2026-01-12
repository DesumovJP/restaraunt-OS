"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ChefRecipeCard, RecipeDetailModal, RecipesTableHeader } from "./chef-recipe-card";
import { RecipeFormModal } from "./recipe-form-modal";
import { useRecipes } from "@/hooks/use-menu";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  ChefHat,
  UtensilsCrossed,
  Wine,
  Cake,
  Snowflake,
  X,
  Loader2,
} from "lucide-react";
import type { Recipe, OutputType } from "@/types";

const OUTPUT_TYPE_OPTIONS: { value: OutputType | "all"; label: string; icon: typeof ChefHat }[] = [
  { value: "all", label: "Всі", icon: UtensilsCrossed },
  { value: "kitchen", label: "Кухня", icon: ChefHat },
  { value: "bar", label: "Бар", icon: Wine },
  { value: "pastry", label: "Кондитерська", icon: Cake },
  { value: "cold", label: "Холодний цех", icon: Snowflake },
];

const OUTPUT_TYPE_LABELS: Record<OutputType, string> = {
  kitchen: "Кухня",
  bar: "Бар",
  pastry: "Кондитерська",
  cold: "Холодний цех",
};


export function ChefRecipesView() {
  // Fetch recipes from GraphQL
  const { recipes: fetchedRecipes, isLoading } = useRecipes();
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedOutputType, setSelectedOutputType] = React.useState<OutputType | "all">("all");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingRecipe, setEditingRecipe] = React.useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = React.useState<Recipe | null>(null);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  // Update local recipes when fetched
  React.useEffect(() => {
    if (fetchedRecipes.length > 0) {
      setRecipes(fetchedRecipes);
    }
  }, [fetchedRecipes]);

  // Filter recipes
  const filteredRecipes = React.useMemo(() => {
    let result = recipes;

    // Filter by output type
    if (selectedOutputType !== "all") {
      result = result.filter((r) => r.outputType === selectedOutputType);
    }

    // Filter by search query
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

  const handleAddRecipe = () => {
    setEditingRecipe(null);
    setIsFormOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsFormOpen(true);
  };

  const handleSaveRecipe = (recipe: Recipe) => {
    if (editingRecipe) {
      // Update existing
      setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? recipe : r)));
    } else {
      // Add new
      setRecipes((prev) => [...prev, recipe]);
    }
    setIsFormOpen(false);
    setEditingRecipe(null);
  };

  const handleReserveIngredients = (recipeId: string, portions: number) => {
    // TODO: Implement actual reservation logic
    console.log(`Reserving ingredients for recipe ${recipeId}, ${portions} portions`);
    // This would call an API to create a reservation
  };

  const handleViewDetails = (recipe: Recipe) => {
    setViewingRecipe(recipe);
  };

  const handleEditFromDetails = () => {
    if (viewingRecipe) {
      setEditingRecipe(viewingRecipe);
      setViewingRecipe(null);
      setIsFormOpen(true);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header - Sticky with iOS-like design */}
      <div className={cn(
        "sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b transition-shadow duration-200",
        isSearchFocused && "shadow-md"
      )}>
        {/* Top row - Title and action */}
        <div className="px-3 sm:px-4 pt-3 pb-2 safe-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
                <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">Рецепти</h1>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  {recipes.length} {recipes.length === 1 ? "рецепт" : recipes.length < 5 ? "рецепти" : "рецептів"}
                </p>
              </div>
            </div>
            <Button
              onClick={handleAddRecipe}
              size="sm"
              className={cn(
                "h-9 sm:h-10 px-3 sm:px-4 rounded-xl shadow-sm",
                "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600",
                "touch-feedback active:scale-[0.97] transition-all"
              )}
            >
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Додати</span>
            </Button>
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
              isSearchFocused ? "text-orange-500" : "text-muted-foreground"
            )} />
            <Input
              type="search"
              placeholder="Пошук за назвою або інгредієнтами..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={cn(
                "pl-9 pr-9 h-10 sm:h-11 rounded-xl border-slate-200 bg-slate-50/80",
                "text-sm placeholder:text-slate-400",
                "focus:bg-white focus:border-orange-300 focus:ring-orange-200",
                "transition-all duration-200"
              )}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Output type filter - Horizontal scroll with snap */}
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
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
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
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
              <Loader2 className="h-7 w-7 text-orange-500 animate-spin" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Завантаження рецептів...</p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <ChefHat className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
              {searchQuery ? "Нічого не знайдено" : "Немає рецептів"}
            </h3>
            <p className="text-sm text-slate-500 text-center max-w-xs">
              {searchQuery
                ? "Спробуйте інший пошуковий запит або змініть фільтр"
                : "Додайте перший рецепт для початку роботи"}
            </p>
            {!searchQuery && (
              <Button
                onClick={handleAddRecipe}
                className="mt-4 rounded-xl shadow-sm bg-gradient-to-r from-orange-500 to-amber-500"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Додати рецепт
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white md:rounded-xl md:border md:shadow-sm md:mx-4 md:mt-4">
            {/* Table Header - Desktop only */}
            <RecipesTableHeader />

            {/* Recipe rows */}
            <div>
              {filteredRecipes.map((recipe) => (
                <ChefRecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onEdit={() => handleEditRecipe(recipe)}
                  onReserve={handleReserveIngredients}
                  onViewDetails={handleViewDetails}
                  outputTypeLabel={recipe.outputType ? OUTPUT_TYPE_LABELS[recipe.outputType] : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bottom padding for safe area */}
        <div className="h-4 safe-bottom" />
      </div>

      {/* Recipe Form Modal */}
      <RecipeFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        recipe={editingRecipe}
        onSave={handleSaveRecipe}
      />

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipe={viewingRecipe}
        open={!!viewingRecipe}
        onOpenChange={(open) => !open && setViewingRecipe(null)}
        onEdit={handleEditFromDetails}
      />
    </div>
  );
}
