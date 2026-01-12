"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ChefHat,
  Wine,
  Cake,
  Snowflake,
  Search,
  Loader2,
} from "lucide-react";
import { useMenu, useIngredients, createRecipe, updateRecipe, createRecipeWithMenuItem, type Ingredient } from "@/hooks/use-menu";
import type { Recipe, OutputType, ServingCourse } from "@/types";

const OUTPUT_TYPE_OPTIONS: { value: OutputType; label: string; icon: typeof ChefHat }[] = [
  { value: "kitchen", label: "Кухня", icon: ChefHat },
  { value: "bar", label: "Бар", icon: Wine },
  { value: "pastry", label: "Кондитерська", icon: Cake },
  { value: "cold", label: "Холодний цех", icon: Snowflake },
];

const SERVING_COURSE_OPTIONS: { value: ServingCourse; label: string }[] = [
  { value: 1, label: "1 - Аперитиви" },
  { value: 2, label: "2 - Закуски" },
  { value: 3, label: "3 - Основні страви" },
  { value: 4, label: "4 - Десерти" },
  { value: 5, label: "5 - Напої" },
];

interface RecipeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe | null;
  onSave: (recipe: Recipe) => void;
}

interface IngredientFormData {
  ingredientId: string;
  ingredient: Ingredient | null;
  quantity: number;
  unit: string;
}

export function RecipeFormModal({
  open,
  onOpenChange,
  recipe,
  onSave,
}: RecipeFormModalProps) {
  // Fetch real data from Strapi
  const { categories, menuItems, isLoading: menuLoading } = useMenu();
  const { ingredients: availableIngredients, isLoading: ingredientsLoading } = useIngredients();

  const [isSaving, setIsSaving] = React.useState(false);

  // Form state
  const [recipeName, setRecipeName] = React.useState<string>("");
  const [selectedMenuItemId, setSelectedMenuItemId] = React.useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("");
  const [price, setPrice] = React.useState<number>(0);
  const [description, setDescription] = React.useState<string>("");
  const [outputType, setOutputType] = React.useState<OutputType>("kitchen");
  const [servingCourse, setServingCourse] = React.useState<ServingCourse>(3);
  const [instructions, setInstructions] = React.useState<string>("");
  const [portionYield, setPortionYield] = React.useState<number>(1);
  const [prepTime, setPrepTime] = React.useState<number>(15);
  const [cookTime, setCookTime] = React.useState<number>(10);
  const [ingredients, setIngredients] = React.useState<IngredientFormData[]>([]);
  const [ingredientSearch, setIngredientSearch] = React.useState("");
  const [createMenuItem, setCreateMenuItem] = React.useState<boolean>(true);

  const isLoading = menuLoading || ingredientsLoading;

  // Initialize form when recipe changes
  React.useEffect(() => {
    if (recipe) {
      setRecipeName(recipe.name || "");
      setSelectedMenuItemId(recipe.menuItem?.id || "");
      setSelectedCategoryId(recipe.menuItem?.categoryId || "");
      setPrice(recipe.menuItem?.price || 0);
      setDescription(recipe.menuItem?.description || "");
      setOutputType(recipe.outputType || "kitchen");
      setServingCourse(3);
      setInstructions("");
      setPortionYield(recipe.portions || 1);
      setPrepTime(recipe.prepTime || 15);
      setCookTime(10);
      setCreateMenuItem(false); // Existing recipe already has menu item
      setIngredients(
        recipe.ingredients?.map((ing) => ({
          ingredientId: ing.product.id,
          ingredient: {
            id: ing.product.id,
            documentId: ing.product.id,
            name: ing.product.name,
            slug: "",
            sku: "",
            unit: ing.product.unit,
            currentStock: ing.product.currentStock || 0,
            costPerUnit: ing.product.costPerUnit || 0,
          },
          quantity: ing.quantity,
          unit: ing.unit,
        })) || []
      );
    } else {
      // Reset form for new recipe
      setRecipeName("");
      setSelectedMenuItemId("");
      setSelectedCategoryId(categories[0]?.id || "");
      setPrice(0);
      setDescription("");
      setOutputType("kitchen");
      setServingCourse(3);
      setInstructions("");
      setPortionYield(1);
      setPrepTime(15);
      setCookTime(10);
      setIngredients([]);
      setCreateMenuItem(true);
    }
  }, [recipe, open, categories]);

  const selectedMenuItem = menuItems.find((m) => m.id === selectedMenuItemId);

  // Filter ingredients by search
  const filteredIngredients = React.useMemo(() => {
    if (!ingredientSearch.trim()) return availableIngredients;
    const query = ingredientSearch.toLowerCase();
    return availableIngredients.filter(
      (ing) =>
        ing.name.toLowerCase().includes(query) ||
        ing.sku.toLowerCase().includes(query)
    );
  }, [availableIngredients, ingredientSearch]);

  const addIngredient = (ingredient: Ingredient) => {
    setIngredients((prev) => [
      ...prev,
      {
        ingredientId: ingredient.id,
        ingredient,
        quantity: 0.1,
        unit: ingredient.unit,
      },
    ]);
    setIngredientSearch("");
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateIngredientData = (index: number, updates: Partial<IngredientFormData>) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, ...updates } : ing))
    );
  };

  // Calculate cost per portion using real ingredient costs
  const costPerPortion = React.useMemo(() => {
    return ingredients.reduce((total, ing) => {
      const unitCost = ing.ingredient?.costPerUnit || 0;
      return total + ing.quantity * unitCost;
    }, 0);
  }, [ingredients]);

  const handleSubmit = async () => {
    if (!recipeName.trim() || ingredients.length === 0) return;

    // Validate category and price for new recipes with menu item creation
    if (!recipe && createMenuItem && (!selectedCategoryId || price <= 0)) {
      alert("Для створення позиції меню потрібно вказати категорію та ціну");
      return;
    }

    setIsSaving(true);

    try {
      const slug = recipeName
        .toLowerCase()
        .replace(/[^a-zа-яіїєґ0-9]+/gi, "-")
        .replace(/^-|-$/g, "");

      const recipeInput = {
        name: recipeName,
        nameUk: recipeName,
        slug: `${slug}-${Date.now()}`,
        portionYield,
        prepTimeMinutes: prepTime,
        cookTimeMinutes: cookTime,
        instructions,
        ingredients: ingredients.map((ing) => ({
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
      };

      let result;
      let menuItemId: string | undefined;

      if (recipe?.documentId) {
        // Update existing recipe
        result = await updateRecipe(recipe.documentId, recipeInput);
      } else if (createMenuItem && selectedCategoryId && price > 0) {
        // Create recipe with menu item
        const combinedResult = await createRecipeWithMenuItem({
          ...recipeInput,
          price,
          categoryId: selectedCategoryId,
          description,
          outputType,
        });
        result = { success: combinedResult.success, documentId: combinedResult.recipeId, error: combinedResult.error };
        menuItemId = combinedResult.menuItemId;
      } else {
        // Create recipe only
        result = await createRecipe(recipeInput);
      }

      if (result.success) {
        // Create a temporary recipe object for the callback
        const savedRecipe: Recipe = {
          id: result.documentId || recipe?.id || `recipe-${Date.now()}`,
          documentId: result.documentId || recipe?.documentId || "",
          slug,
          name: recipeName,
          menuItem: selectedMenuItem || {
            id: menuItemId || "",
            documentId: menuItemId || "",
            slug,
            name: recipeName,
            price,
            categoryId: selectedCategoryId,
            available: true,
            preparationTime: prepTime + cookTime,
            outputType,
          },
          outputType,
          prepTime,
          portions: portionYield,
          costPerPortion,
          ingredients: ingredients.map((ing) => ({
            product: {
              id: ing.ingredient?.id || "",
              name: ing.ingredient?.name || "",
              unit: ing.ingredient?.unit || "kg",
              costPerUnit: ing.ingredient?.costPerUnit || 0,
              currentStock: ing.ingredient?.currentStock || 0,
            },
            quantity: ing.quantity,
            unit: ing.unit,
            isOptional: false,
          })),
          steps: [],
          isActive: true,
        };

        onSave(savedRecipe);
        onOpenChange(false);
      } else {
        console.error("Failed to save recipe:", result.error);
        alert(`Помилка збереження: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to save recipe:", error);
      alert("Помилка збереження рецепту");
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = recipeName.trim() && ingredients.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {recipe ? "Редагувати рецепт" : "Новий рецепт"}
          </DialogTitle>
          <DialogDescription>
            {recipe
              ? "Змініть деталі рецепту та збережіть зміни."
              : "Створіть новий рецепт для страви з меню."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 px-4 sm:px-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
        <div className="space-y-6 py-4 px-4 sm:px-6">
          {/* Recipe Name */}
          <div className="space-y-2">
            <Label htmlFor="recipeName">Назва рецепту *</Label>
            <Input
              id="recipeName"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="Введіть назву рецепту"
            />
          </div>

          {/* Menu Item Creation Options (for new recipes) */}
          {!recipe && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Додати до меню</Label>
                <button
                  type="button"
                  onClick={() => setCreateMenuItem(!createMenuItem)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    createMenuItem ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      createMenuItem ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {createMenuItem && (
                <>
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Категорія меню *</Label>
                    <Select
                      value={selectedCategoryId}
                      onValueChange={setSelectedCategoryId}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Оберіть категорію" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price and Description */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Ціна (грн) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min={0}
                        step={1}
                        value={price || ""}
                        onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Опис</Label>
                      <Input
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Короткий опис страви"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Link to Existing Menu Item (for existing recipes) */}
          {recipe && (
            <div className="space-y-2">
              <Label htmlFor="menuItem">Пов'язана страва з меню</Label>
              <Select
                value={selectedMenuItemId}
                onValueChange={setSelectedMenuItemId}
              >
                <SelectTrigger id="menuItem">
                  <SelectValue placeholder="Оберіть страву (необов'язково)" />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - {item.price} грн
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Output Type and Serving Course */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="outputType">Тип видачі *</Label>
              <Select
                value={outputType}
                onValueChange={(v: string) => setOutputType(v as OutputType)}
              >
                <SelectTrigger id="outputType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTPUT_TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servingCourse">Черга подачі *</Label>
              <Select
                value={String(servingCourse)}
                onValueChange={(v: string) => setServingCourse(Number(v) as ServingCourse)}
              >
                <SelectTrigger id="servingCourse">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVING_COURSE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Portion Yield and Times */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="portionYield">Вихід порцій</Label>
              <Input
                id="portionYield"
                type="number"
                min={1}
                value={portionYield}
                onChange={(e) => setPortionYield(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prepTime">Підготовка (хв)</Label>
              <Input
                id="prepTime"
                type="number"
                min={0}
                value={prepTime}
                onChange={(e) => setPrepTime(Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cookTime">Готування (хв)</Label>
              <Input
                id="cookTime"
                type="number"
                min={0}
                value={cookTime}
                onChange={(e) => setCookTime(Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Інгредієнти *</Label>
              <Badge variant="outline">{ingredients.length} позицій</Badge>
            </div>

            {/* Existing ingredients */}
            {ingredients.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {ingredients.map((ing, index) => (
                  <div
                    key={`${ing.ingredientId}-${index}`}
                    className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate block">
                        {ing.ingredient?.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        На складі: {ing.ingredient?.currentStock || 0} {ing.ingredient?.unit}
                      </span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={ing.quantity}
                      onChange={(e) =>
                        updateIngredientData(index, {
                          quantity: parseFloat(e.target.value) || 0.01,
                        })
                      }
                      className="w-20 h-8 text-center"
                    />
                    <Select
                      value={ing.unit}
                      onValueChange={(v: string) => updateIngredientData(index, { unit: v })}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">кг</SelectItem>
                        <SelectItem value="g">г</SelectItem>
                        <SelectItem value="l">л</SelectItem>
                        <SelectItem value="ml">мл</SelectItem>
                        <SelectItem value="pcs">шт</SelectItem>
                        <SelectItem value="portion">порц</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeIngredient(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add ingredient */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук інгредієнта для додавання..."
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {ingredientSearch && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {filteredIngredients.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    Інгредієнти не знайдено
                  </div>
                ) : (
                  filteredIngredients.slice(0, 10).map((ingredient) => {
                    const isAdded = ingredients.some(
                      (ing) => ing.ingredientId === ingredient.id
                    );
                    return (
                      <button
                        key={ingredient.id}
                        onClick={() => !isAdded && addIngredient(ingredient)}
                        disabled={isAdded}
                        className={cn(
                          "w-full flex items-center justify-between p-2 hover:bg-muted transition-colors text-left",
                          isAdded && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div>
                          <span className="font-medium text-sm">{ingredient.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({ingredient.currentStock} {ingredient.unit})
                          </span>
                        </div>
                        {isAdded ? (
                          <Badge variant="secondary" className="text-xs">
                            Додано
                          </Badge>
                        ) : (
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Інструкції приготування</Label>
            <Textarea
              id="instructions"
              placeholder="Опишіть кроки приготування страви..."
              value={instructions}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInstructions(e.target.value)}
              rows={4}
            />
          </div>

          {/* Cost Preview */}
          {ingredients.length > 0 && (
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Орієнтовна собівартість:</span>
                <span className="font-semibold">{costPerPortion.toFixed(2)} грн</span>
              </div>
              {(selectedMenuItem || (createMenuItem && price > 0)) && (
                <>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Ціна в меню:</span>
                    <span className="font-semibold">{selectedMenuItem?.price || price} грн</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Маржа:</span>
                    <span className={cn(
                      "font-semibold",
                      ((selectedMenuItem?.price || price) - costPerPortion) > 0 ? "text-success" : "text-destructive"
                    )}>
                      {((selectedMenuItem?.price || price) - costPerPortion).toFixed(2)} грн (
                      {((((selectedMenuItem?.price || price) - costPerPortion) / (selectedMenuItem?.price || price)) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        )}

        <DialogFooter className="border-t pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSaving}
            className="w-full h-11 text-base font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Збереження...
              </>
            ) : (
              recipe ? "Зберегти зміни" : "Створити рецепт"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
