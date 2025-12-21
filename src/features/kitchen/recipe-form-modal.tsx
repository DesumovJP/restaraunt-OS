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
import { menuApi, inventoryApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ChefHat,
  Wine,
  Cake,
  Snowflake,
  Search,
} from "lucide-react";
import type { Recipe, MenuItem, Product, RecipeIngredient, OutputType, ServingCourse } from "@/types";

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
  productId: string;
  product: Product | null;
  quantity: number;
  unit: string;
}

export function RecipeFormModal({
  open,
  onOpenChange,
  recipe,
  onSave,
}: RecipeFormModalProps) {
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Form state
  const [selectedMenuItemId, setSelectedMenuItemId] = React.useState<string>("");
  const [outputType, setOutputType] = React.useState<OutputType>("kitchen");
  const [servingCourse, setServingCourse] = React.useState<ServingCourse>(3);
  const [instructions, setInstructions] = React.useState<string>("");
  const [portionYield, setPortionYield] = React.useState<number>(1);
  const [ingredients, setIngredients] = React.useState<IngredientFormData[]>([]);
  const [productSearch, setProductSearch] = React.useState("");

  // Load menu items and products
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [menuRes, productsRes] = await Promise.all([
          menuApi.getMenuItems(),
          inventoryApi.getProducts(),
        ]);
        if (menuRes.success) setMenuItems(menuRes.data);
        if (productsRes.success) setProducts(productsRes.data);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    if (open) {
      loadData();
    }
  }, [open]);

  // Initialize form when recipe changes
  React.useEffect(() => {
    if (recipe) {
      setSelectedMenuItemId(recipe.menuItemId);
      setOutputType(recipe.outputType || "kitchen");
      setServingCourse(recipe.servingCourse || 3);
      setInstructions(recipe.instructions || "");
      setPortionYield(recipe.portionYield);
      setIngredients(
        recipe.ingredients.map((ing) => ({
          productId: ing.productId,
          product: ing.product,
          quantity: ing.quantity,
          unit: ing.unit,
        }))
      );
    } else {
      // Reset form for new recipe
      setSelectedMenuItemId("");
      setOutputType("kitchen");
      setServingCourse(3);
      setInstructions("");
      setPortionYield(1);
      setIngredients([]);
    }
  }, [recipe, open]);

  const selectedMenuItem = menuItems.find((m) => m.id === selectedMenuItemId);

  // Filter products by search
  const filteredProducts = React.useMemo(() => {
    if (!productSearch.trim()) return products;
    const query = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query)
    );
  }, [products, productSearch]);

  const addIngredient = (product: Product) => {
    setIngredients((prev) => [
      ...prev,
      {
        productId: product.id,
        product,
        quantity: 0.1,
        unit: product.unit,
      },
    ]);
    setProductSearch("");
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, updates: Partial<IngredientFormData>) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, ...updates } : ing))
    );
  };

  // Calculate cost per portion
  const costPerPortion = React.useMemo(() => {
    // This is a simplified calculation - in real app would use actual prices
    return ingredients.reduce((total, ing) => {
      // Assuming some base cost per unit
      const unitCost = 50; // placeholder
      return total + ing.quantity * unitCost;
    }, 0);
  }, [ingredients]);

  const handleSubmit = () => {
    if (!selectedMenuItem || ingredients.length === 0) return;

    const recipeData: Recipe = {
      id: recipe?.id || `recipe-${Date.now()}`,
      menuItemId: selectedMenuItemId,
      menuItem: selectedMenuItem,
      ingredients: ingredients.map((ing) => ({
        productId: ing.productId,
        product: ing.product!,
        quantity: ing.quantity,
        unit: ing.unit,
      })),
      instructions,
      portionYield,
      costPerPortion,
      outputType,
      servingCourse,
    };

    onSave(recipeData);
    onOpenChange(false);
  };

  const isValid = selectedMenuItemId && ingredients.length > 0;

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

        <div className="space-y-6 py-4">
          {/* Menu Item Selection */}
          <div className="space-y-2">
            <Label htmlFor="menuItem">Страва з меню *</Label>
            <Select
              value={selectedMenuItemId}
              onValueChange={setSelectedMenuItemId}
            >
              <SelectTrigger id="menuItem">
                <SelectValue placeholder="Оберіть страву" />
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

          {/* Portion Yield */}
          <div className="space-y-2">
            <Label htmlFor="portionYield">Вихід порцій</Label>
            <Input
              id="portionYield"
              type="number"
              min={1}
              value={portionYield}
              onChange={(e) => setPortionYield(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-32"
            />
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
                    key={`${ing.productId}-${index}`}
                    className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                  >
                    <span className="flex-1 font-medium text-sm truncate">
                      {ing.product?.name}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={ing.quantity}
                      onChange={(e) =>
                        updateIngredient(index, {
                          quantity: parseFloat(e.target.value) || 0.01,
                        })
                      }
                      className="w-20 h-8 text-center"
                    />
                    <Select
                      value={ing.unit}
                      onValueChange={(v: string) => updateIngredient(index, { unit: v })}
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
                placeholder="Пошук продукту для додавання..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {productSearch && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    Продукти не знайдено
                  </div>
                ) : (
                  filteredProducts.slice(0, 10).map((product) => {
                    const isAdded = ingredients.some(
                      (ing) => ing.productId === product.id
                    );
                    return (
                      <button
                        key={product.id}
                        onClick={() => !isAdded && addIngredient(product)}
                        disabled={isAdded}
                        className={cn(
                          "w-full flex items-center justify-between p-2 hover:bg-muted transition-colors text-left",
                          isAdded && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div>
                          <span className="font-medium text-sm">{product.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({product.sku})
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
          {ingredients.length > 0 && selectedMenuItem && (
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Орієнтовна собівартість:</span>
                <span className="font-semibold">{costPerPortion.toFixed(2)} грн</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Ціна в меню:</span>
                <span className="font-semibold">{selectedMenuItem.price} грн</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Маржа:</span>
                <span className="font-semibold text-success">
                  {(selectedMenuItem.price - costPerPortion).toFixed(2)} грн (
                  {(((selectedMenuItem.price - costPerPortion) / selectedMenuItem.price) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            {recipe ? "Зберегти зміни" : "Створити рецепт"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
