"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ChefRecipeCard, RecipeDetailModal } from "./chef-recipe-card";
import { RecipeFormModal } from "./recipe-form-modal";
import { useRecipes } from "@/hooks/use-menu";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Filter,
  ChefHat,
  UtensilsCrossed,
  Wine,
  Cake,
  Snowflake,
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b px-3 sm:px-4 py-3 safe-top">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-600" />
            <h1 className="text-lg sm:text-xl font-bold">Рецепти</h1>
            <Badge variant="secondary">{recipes.length}</Badge>
          </div>
          <Button onClick={handleAddRecipe} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Додати рецепт</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Пошук за назвою страви або інгредієнтами..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 sm:h-10"
          />
        </div>

        {/* Output type filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          {OUTPUT_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = selectedOutputType === option.value;
            const count = recipesByType[option.value];

            return (
              <button
                key={option.value}
                onClick={() => setSelectedOutputType(option.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-orange-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="h-4 w-4" />
                {option.label}
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className={cn(
                    "h-5 px-1.5 text-xs",
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-0.5 p-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-5 bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredRecipes.length === 0 ? (
          <EmptyState
            type={searchQuery ? "search" : "menu"}
            title={searchQuery ? "Нічого не знайдено" : "Немає рецептів"}
            description={
              searchQuery
                ? "Спробуйте інший пошуковий запит"
                : "Додайте перший рецепт для початку роботи"
            }
          />
        ) : (
          <div className="divide-y">
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
        )}
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
